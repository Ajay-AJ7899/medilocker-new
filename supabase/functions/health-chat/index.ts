import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, patientContext, predictionContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `You are MediLocker AI, a helpful health assistant. You provide general health information and suggestions.

IMPORTANT: You are NOT a doctor. Always remind users that your suggestions are not a substitute for professional medical advice.

Patient Context:
- Name: ${patientContext?.name || "Unknown"}
- Blood Type: ${patientContext?.bloodType || "Unknown"}
- Known Allergies: ${patientContext?.allergies?.join(", ") || "None reported"}`;

    if (predictionContext) {
      systemPrompt += `

Current Prediction Being Discussed:
- Predicted Condition: ${predictionContext.disease}
- Confidence: ${predictionContext.confidence}%
- Risk Level: ${predictionContext.riskLevel}
- Key Contributing Factors: ${predictionContext.factors?.map((f: { factor: string; contribution: number }) => `${f.factor} (${f.contribution}%)`).join(", ")}
- Prevention Tips: ${predictionContext.prevention?.join("; ")}

When asked about this prediction, explain it in simple, plain English that a non-medical person can understand. Use analogies when helpful. Be empathetic and reassuring while being honest about risks. Avoid medical jargon.`;
    }

    systemPrompt += `

Use the context above to provide personalized but cautious health suggestions. Be empathetic, clear, and concise. If the patient mentions symptoms that could be serious, always recommend seeing a healthcare professional immediately.

Format your responses with markdown for readability.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Health chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
