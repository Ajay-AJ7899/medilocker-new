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
    const { recordTitle, category, scanType, description, patientContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a medical AI assistant analyzing medical scan/record information. Based on the provided details, give a brief clinical analysis (2-3 sentences) and determine if the case requires urgent attention.

You are NOT reading actual images - you are analyzing the textual context of the medical record to provide reasoning about potential findings and urgency.

Be concise, professional, and medically accurate. If the description suggests anything potentially life-threatening or time-sensitive, flag it as urgent.`;

    const userPrompt = `Analyze this medical record:
- Title: ${recordTitle}
- Category: ${category}
- Scan Type: ${scanType || "N/A"}
- Description: ${description || "No description provided"}
${patientContext ? `- Patient: ${patientContext.name || "Unknown"}, Blood Type: ${patientContext.bloodType || "Unknown"}, Allergies: ${patientContext.allergies?.join(", ") || "None"}` : ""}

Respond with a JSON object: { "analysis": "your analysis text", "isUrgent": true/false, "urgencyReason": "reason or null" }`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_scan",
            description: "Return analysis of a medical scan/record",
            parameters: {
              type: "object",
              properties: {
                analysis: { type: "string", description: "Brief clinical analysis (2-3 sentences)" },
                isUrgent: { type: "boolean", description: "Whether case requires urgent attention" },
                urgencyReason: { type: "string", description: "Reason for urgency, or null" },
              },
              required: ["analysis", "isUrgent"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_scan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ analysis: content, isUrgent: false, urgencyReason: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Analyze scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
