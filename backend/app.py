from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

if not MISTRAL_API_KEY:
    raise RuntimeError("MISTRAL_API_KEY is not set. Add it to backend/.env")

# Simple greetings for quick check
GREETINGS = ["hi", "hello", "hey", "hii", "yo", "namaste", "hola", "नमस्ते", "हाय", "हेलो"]


def is_greeting(message: str) -> bool:
    """Quick greeting detection"""
    msg = message.lower().strip()
    msg_clean = re.sub(r'[^\w\s]', '', msg)
    words = msg_clean.split()
    # Check if it's a short message with greeting words
    if len(words) <= 5:  # Increased from 3 to catch "hi there", "hello how are you"
        return any(word in GREETINGS for word in words)
    return False


def clean_response(response: str) -> str:
    """Remove meta-text like word counts and translation notes from AI responses"""
    # Remove word count patterns
    response = re.sub(r'\(Word count:?\s*\d+\)', '', response, flags=re.IGNORECASE)
    response = re.sub(r'Word count:?\s*\d+', '', response, flags=re.IGNORECASE)
    
    # Remove translation notes
    response = re.sub(r'\(Translation.*?\)', '', response, flags=re.IGNORECASE | re.DOTALL)
    response = re.sub(r'If you\'d like.*?another language.*?\n*', '', response, flags=re.IGNORECASE | re.DOTALL)
    response = re.sub(r'Note:.*?translation.*?\n*', '', response, flags=re.IGNORECASE | re.DOTALL)
    
    # Clean up extra whitespace
    response = re.sub(r'\n{3,}', '\n\n', response)  # Max 2 newlines
    response = response.strip()
    
    return response


def call_mistral(prompt: str) -> str:
    """Call Mistral API with error handling"""
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.Timeout:
        raise Exception("Request to Mistral API timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error calling Mistral API: {str(e)}")


def check_relevance_with_ai(user_prompt: str) -> dict:
    """
    Use AI to intelligently check if question is about Indian finance.
    Returns: {"is_relevant": bool, "language": str, "reason": str}
    """
    check_prompt = f"""You are a relevance checker for an Indian financial literacy chatbot.

USER QUESTION: "{user_prompt}"

TASK: Determine if this question is related to Indian financial literacy topics.

FINANCIAL TOPICS INCLUDE (in ANY language):
- Banking, loans (home loan, personal loan, car loan, education loan, business loan)
- Savings, investments, mutual funds, stocks, bonds, FD, RD
- Insurance (life, health, vehicle, property)
- Taxes (income tax, GST, TDS)
- Government schemes (PM schemes, subsidies, welfare programs)
- Budgeting, money management, financial planning
- Credit cards, credit score, EMI
- Retirement planning (PPF, NPS, pension)
- RBI regulations, monetary policy
- Real estate, property investment
- Gold, commodities

RESPOND IN THIS EXACT JSON FORMAT (nothing else):
{{
  "is_relevant": true/false,
  "language": "detected language (e.g., Hindi, English, Tamil, Telugu, etc.)",
  "reason": "brief explanation"
}}

IMPORTANT:
- If question is about finance/money/banking/schemes in ANY language → is_relevant: true
- If question is about weather, sports, cooking, general knowledge, etc. → is_relevant: false
- Detect the language correctly (Hindi, English, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, etc.)
- Be lenient with typos and spelling mistakes"""

    try:
        response = call_mistral(check_prompt)
        # Extract JSON from response (in case Mistral adds extra text)
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            import json
            return json.loads(json_match.group())
        else:
            # Fallback: assume relevant if we can't parse
            return {"is_relevant": True, "language": "English", "reason": "Could not parse response"}
    except Exception as e:
        print(f"[ERROR] AI relevance check failed: {str(e)}")
        # Fallback: assume relevant to avoid blocking users
        return {"is_relevant": True, "language": "English", "reason": "Fallback due to error"}


@app.post("/ask")
def ask():
    try:
        data = request.get_json(silent=True) or {}
        user_prompt = data.get("prompt", "").strip()

        if not user_prompt:
            return jsonify({"error": "Prompt is required"}), 400

        print(f"[DEBUG] Received prompt: {user_prompt}")

        
        if is_greeting(user_prompt):
            print(f"[DEBUG] Detected greeting")
            # Detect language for greeting
            greeting_check_prompt = f"""Detect the language of this greeting: "{user_prompt}"

Respond with ONLY the language name: English, Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, etc.

If unsure, respond with: English"""
            
            try:
                detected_lang = call_mistral(greeting_check_prompt).strip()
                print(f"[DEBUG] Greeting language: {detected_lang}")
            except:
                detected_lang = "English"
            
            greeting_prompt = f"""The user greeted you with: "{user_prompt}"

CRITICAL: Respond COMPLETELY in {detected_lang}. Every single word must be in {detected_lang}.

1. Greet them back warmly in {detected_lang}
2. Introduce yourself as a financial literacy assistant for India in {detected_lang}
3. Give ONE simple practical finance tip in {detected_lang}

Keep it friendly and under 80 words. Use {detected_lang} ONLY.

DO NOT include word counts, notes, or meta-commentary. Provide ONLY the greeting message itself."""
            
            try:
                greeting_response = call_mistral(greeting_prompt)
                greeting_response = clean_response(greeting_response)
                return jsonify({"response": greeting_response})
            except Exception as e:
                print(f"[ERROR] Greeting response failed: {str(e)}")
                return jsonify({"response": "Hello! I'm your Indian financial literacy assistant. I can help you with questions about loans, savings, investments, taxes, insurance, and government schemes. How can I help you today?"})
            
        else:
            # 2️⃣ AI-powered relevance check
            print(f"[DEBUG] Checking relevance with AI...")
            relevance_check = check_relevance_with_ai(user_prompt)
            print(f"[DEBUG] Relevance result: {relevance_check}")

        # 3️⃣ If not relevant, return error in detected language
        if not relevance_check.get("is_relevant", True):
            detected_language = relevance_check.get("language", "English")
            
            error_prompt = f"""The user asked: "{user_prompt}"

This question is NOT about Indian financial literacy.

CRITICAL: Respond in {detected_language} ONLY. No English if {detected_language} is not English.

Message to convey: "I can only answer questions about Indian financial topics like loans, savings, investments, taxes, insurance, government schemes, banking, and money management. Please ask a finance-related question."

Translate this ENTIRE message to {detected_language}.

DO NOT add any notes, explanations, or meta-commentary about translation.
DO NOT mention English or other languages.
Provide ONLY the translated message itself."""

            try:
                error_response = call_mistral(error_prompt)
                error_response = clean_response(error_response)
                return jsonify({"response": error_response})
            except Exception:
                return jsonify({
                    "response": "I can only answer questions about Indian financial topics like loans, savings, investments, taxes, insurance, government schemes, banking, and money management. Please ask a finance-related question."
                })

        # 4️⃣ Question is relevant - generate full answer
        detected_language = relevance_check.get("language", "English")
        print(f"[DEBUG] Generating answer in {detected_language}")

        final_prompt = f"""⚠️⚠️⚠️ CRITICAL LANGUAGE INSTRUCTION ⚠️⚠️⚠️

The user asked in {detected_language}: "{user_prompt}"

YOU MUST RESPOND COMPLETELY IN {detected_language}.
EVERY single word, sentence, heading, paragraph, and bullet point must be in {detected_language}.

STRICT LANGUAGE RULES:
- If {detected_language} is "English" → Respond ONLY in English
- If {detected_language} is "Hindi" → Respond ONLY in Hindi (हिंदी में)
- If {detected_language} is "Tamil" → Respond ONLY in Tamil (தமிழில்)
- If {detected_language} is "Telugu" → Respond ONLY in Telugu (తెలుగులో)
- If {detected_language} is "Bengali" → Respond ONLY in Bengali (বাংলায়)
- If {detected_language} is "Gujarati" → Respond ONLY in Gujarati (ગુજરાતીમાં)
- If {detected_language} is "Marathi" → Respond ONLY in Marathi (मराठीत)
- And so on for ANY language detected

DO NOT mix languages. DO NOT use English words if the detected language is not English.
DO NOT add translations in parentheses.
DO NOT add word counts or meta-commentary.

TYPO HANDLING:
- User may have spelling mistakes in ANY language
- Intelligently understand the intent (e.g., "loaan" = "loan", "invset" = "invest", "engkish" = "english")
- Answer the intended question naturally without pointing out errors

CONTENT REQUIREMENTS:
You are an Indian financial literacy expert. Answer in the context of:
- Indian banking system, RBI guidelines
- Government schemes (PM schemes, state schemes, subsidies)
- Indian tax laws (Income Tax Act, GST)
- Indian investment options (PPF, NPS, mutual funds, stocks, FD, RD)
- Loan types available in India (home, personal, education, business, car loans)
- Insurance in India (LIC, health insurance, term insurance)
- Credit system in India (CIBIL score, credit cards, EMI)

Give practical, actionable advice with steps when relevant.

FORMAT (in {detected_language}):
1. Use `###` for headings
2. One blank line after every heading
3. One blank line between paragraphs
4. Use bullet points for lists
5. Bold important terms with **bold**
6. Keep it clean, spacious, and readable

REMEMBER: Write EVERYTHING in {detected_language}. Provide ONLY the answer itself, no meta-text.

User's question: {user_prompt}"""

        response_text = call_mistral(final_prompt)
        response_text = clean_response(response_text)
        print(f"[DEBUG] Successfully generated response")
        return jsonify({"response": response_text})

    except Exception as exc:
        print(f"[ERROR] Exception in /ask endpoint: {str(exc)}")
        return jsonify({"error": str(exc)}), 500


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("[INFO] Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5000)