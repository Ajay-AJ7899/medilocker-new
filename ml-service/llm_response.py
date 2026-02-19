SYSTEM_PROMPT = """
You are a clinical decision support assistant.

You must explain a diabetes risk assessment using ONLY the structured data provided.
You are NOT allowed to:
- Add new risk factors
- Add medical advice
- Diagnose disease
- Infer causes not explicitly mentioned
- Mention model internals or algorithms

You MUST:
- Use cautious, non-diagnostic language
- Explain why the risk level was assigned
- Reference only the provided factors and patterns
- Write for clinicians (clear, concise, neutral tone)

If information is missing, do NOT speculate.
"""


def build_user_prompt(reasoning_json: dict) -> str:
    return f"""
Using the following structured risk assessment data, explain the result
in clear, clinician-friendly language.

Risk Assessment Data (GROUND TRUTH):
{reasoning_json}

Do not introduce new information.
"""
import google.generativeai as genai
import json

# Configure Gemini
genai.configure(api_key="AIzaSyBNB1TG7TUpInM2ecnLMXtlj2P4mjf6Nik")

# Choose model
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",  # fast + cheap
    # model_name="gemini-1.5-pro",  # better reasoning
    generation_config={
        "temperature": 0.2,  # low hallucination (similar to OpenAI)
    }
)

def generate_explanation(reasoning_json: dict) -> str:
    prompt = f"""
{SYSTEM_PROMPT}

{build_user_prompt(reasoning_json)}
"""

    response = model.generate_content(prompt)

    return response.text