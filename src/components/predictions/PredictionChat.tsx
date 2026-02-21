import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import type { PredictionData } from "@/lib/mockPredictions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  prediction: PredictionData;
  patientName?: string | null;
  bloodType?: string | null;
  allergies?: string[] | null;
  showSummary?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const QUICK_REPLIES = [
  "What does this mean?",
  "How can I prevent this?",
  "Is this serious?",
  "Explain like I'm 5",
];

function buildSummary(p: PredictionData, name?: string | null): string {
  const riskWord = { low: "a low", medium: "a moderate", high: "a high", critical: "a very high" }[p.risk_level] ?? "a";
  const top = [...p.explainability].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
  return `Based on your health data, the AI has identified **${riskWord}-risk signal** for **${p.predicted_disease}** with **${p.confidence}% confidence**. The two biggest factors driving this result are **${top[0]?.factor}** and **${top[1]?.factor}**. This does not mean you have this condition — it means your profile shares patterns with people who develop it. Your doctor can help you interpret this and decide on next steps.`;
}

/** Animated typing dots */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-primary/60"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </div>
);

export const PredictionChat = ({ prediction, patientName, bloodType, allergies, showSummary = true }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text.trim() };
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
          patientContext: { name: patientName, bloodType, allergies },
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
      {/* Plain English Summary with medical cross watermark */}
      {showSummary && (
        <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
          {/* Watermark */}
          <div className="pointer-events-none absolute right-4 top-4 opacity-[0.04]">
            <Plus className="h-24 w-24 text-primary" strokeWidth={3} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
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
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            Ask the AI Assistant
          </CardTitle>
          <p className="text-xs text-muted-foreground">Ask questions about this prediction in plain language</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Message list */}
          <div className="h-72 overflow-y-auto rounded-xl border border-border bg-secondary/10 p-3 space-y-3">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-col items-center justify-center text-center text-muted-foreground gap-3"
                >
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <MessageSquare className="h-7 w-7 text-primary/40" />
                    </div>
                    <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60">Start a conversation</p>
                    <p className="text-xs mt-0.5">Try a quick question below or type your own</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === "user" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-card border border-border px-3 py-2 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick reply chips */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/40 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask about this prediction…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              disabled={isLoading}
              className="rounded-full"
            />
            <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} size="icon" className="rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
