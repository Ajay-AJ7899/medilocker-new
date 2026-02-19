import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { PredictionData } from "@/lib/mockPredictions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  prediction: PredictionData;
  patientName?: string | null;
  bloodType?: string | null;
  allergies?: string[] | null;
  /** If true, renders the static plain-English summary at top */
  showSummary?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function buildSummary(p: PredictionData, name?: string | null): string {
  const riskWord = { low: "a low", medium: "a moderate", high: "a high", critical: "a very high" }[p.risk_level] ?? "a";
  const top = [...p.explainability].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
  return `Based on your health data, the AI has identified **${riskWord}-risk signal** for **${p.predicted_disease}** with **${p.confidence}% confidence**. The two biggest factors driving this result are **${top[0]?.factor}** and **${top[1]?.factor}**. This does not mean you have this condition — it means your profile shares patterns with people who develop it. Your doctor can help you interpret this and decide on next steps.`;
}

export const PredictionChat = ({ prediction, patientName, bloodType, allergies, showSummary = true }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const history = [...messages, userMsg];

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/health-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          patientContext: {
            name: patientName,
            bloodType,
            allergies,
          },
          predictionContext: {
            disease: prediction.predicted_disease,
            confidence: prediction.confidence,
            riskLevel: prediction.risk_level,
            factors: prediction.explainability,
            prevention: prediction.prevention,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        if (resp.status === 429) toast.error("Rate limit exceeded. Try again later.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error(err.error ?? "AI service error");
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      // Add empty assistant message to fill progressively
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) {
              assistantSoFar += chunk;
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m))
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Plain English Summary */}
      {showSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" />
              What this means in plain English
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm text-foreground">
              <ReactMarkdown>{buildSummary(prediction, patientName)}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Ask the AI Assistant
          </CardTitle>
          <p className="text-xs text-muted-foreground">Ask questions about this prediction in plain language</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Message list */}
          <div className="h-64 overflow-y-auto rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Ask something like "What does this mean for me?" or "How serious is this?"</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === "user" && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask about this prediction…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={isLoading}
            />
            <Button onClick={send} disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
