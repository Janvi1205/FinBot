from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from difflib import get_close_matches
import re


load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

# Allowed topics list
ALLOWED_TOPICS = [
    "scheme", "yojana", "finance", "financial", "budget", "saving",
    "investment", "investing", "income tax", "mutual fund", "insurance",
    "rbi", "loan", "pf", "pension", "subsidy", "government benefit", "invest"
]
 
# Greeting words
GREETINGS = ["hi", "hello", "hey", "hii", "yo", "namaste", "hola"]


def is_greeting(message: str) -> bool:
    msg = message.lower().strip()

    # Remove punctuation for better matching
    msg_clean = re.sub(r'[^\w\s]', '', msg)

    # Split into words
    words = msg_clean.split()

    return any(word in GREETINGS for word in words)


def is_relevant(message: str) -> bool:
    """
    Fuzzy matching for financial relevance.
    Detects misspellings like:
    - invset → invest
    - schmee → scheme
    - ln → loan
    """
    words = message.lower().split()

    for word in words:
        # Lower threshold to catch more typos (0.6 instead of 0.7)
        match = get_close_matches(word, ALLOWED_TOPICS, cutoff=0.6)
        if match:
            return True

    return False


@app.post("/ask")
def ask():
    data = request.get_json(silent=True) or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Detect if user explicitly requests a language
    user_prompt_lower = user_prompt.lower()
    requested_language = None
    language_keywords = {
        "bengali": "Bengali",
        "bangla": "Bengali", 
        "hindi": "Hindi",
        "tamil": "Tamil",
        "telugu": "Telugu",
        "gujarati": "Gujarati",
        "marathi": "Marathi",
        "malayalam": "Malayalam",
        "kannada": "Kannada",
        "punjabi": "Punjabi",
        "odia": "Odia",
        "assamese": "Assamese",
        "urdu": "Urdu"
    }
    
    for keyword, lang in language_keywords.items():
        if f"in {keyword}" in user_prompt_lower or keyword in user_prompt_lower:
            requested_language = lang
            # Remove language request from prompt to avoid confusion
            user_prompt = re.sub(rf'\s*in\s+{keyword}\s*', ' ', user_prompt, flags=re.IGNORECASE).strip()
            break

    # 1️⃣ Greeting — Always allowed
    if is_greeting(user_prompt):
        user_prompt = f"{user_prompt}. Also give one simple Indian finance tip."

    # 2️⃣ Financial relevance check (fuzzy)
    elif not is_relevant(user_prompt):
        # Detect language and respond accordingly
        error_prompt = (
            "The user asked: '{user_prompt}'\n\n"
            "CRITICAL LANGUAGE REQUIREMENT:\n"
            "{language_instruction}\n"
            "Respond with: 'I can answer only questions related to Indian financial literacy — "
            "like budgeting, saving, investing, RBI rules, loans, tax, and government schemes.\n\n"
            "Please ask something from these topics.'\n"
            "Translate this ENTIRE message to match the user's language. EVERY SINGLE WORD must be in that language."
        ).format(
            user_prompt=user_prompt,
            language_instruction=(
                f"Respond COMPLETELY in {requested_language}. EVERY SINGLE WORD, sentence, and paragraph must be in {requested_language}."
                if requested_language else
                "Detect the language of the user's question and respond in EXACTLY that same language. EVERY SINGLE WORD must be in that language."
            )
        )
        
        try:
            error_response = model.generate_content(error_prompt)
            return jsonify({"response": error_response.text})
        except Exception:
            # Fallback to English if error occurs
            return jsonify({
                "response":
                "I can answer only questions related to Indian financial literacy — "
                "like budgeting, saving, investing, RBI rules, loans, tax, and government schemes.\n\n"
                "Please ask something from these topics."
            })

    # 3️⃣ If relevant → continue normally
    if requested_language:
        language_instruction = (
            f"CRITICAL: The user has requested the response in {requested_language}.\n"
            f"You MUST respond COMPLETELY in {requested_language}. EVERY SINGLE WORD, sentence, heading, paragraph, and bullet point must be in {requested_language}.\n"
            f"DO NOT mix languages. DO NOT use English words. DO NOT provide English translations in parentheses.\n"
            f"Write the ENTIRE response from start to finish ONLY in {requested_language}.\n"
        )
    else:
        language_instruction = (
            "Detect the language of the user's question and respond in EXACTLY that same language.\n"
            "If the user asks in Hindi, respond COMPLETELY in Hindi. If they ask in English, respond COMPLETELY in English.\n"
            "If they ask in Tamil, Telugu, Bengali, Gujarati, Marathi, or any other language, respond COMPLETELY in that same language.\n"
            "EVERY SINGLE WORD, sentence, heading, paragraph, and bullet point must be in that detected language.\n"
            "DO NOT mix languages. DO NOT use English words or translations in parentheses.\n"
        )
    
    final_prompt = (
        "⚠️⚠️⚠️ LANGUAGE INSTRUCTION (MOST CRITICAL - READ THIS FIRST) ⚠️⚠️⚠️\n"
        f"{language_instruction}\n"
        "Write the ENTIRE response from start to finish in ONE language only.\n\n"
        "TYPO AND SPELLING ERROR HANDLING:\n"
        "The user's question may contain typos, spelling mistakes, or incorrect spellings.\n"
        "You MUST automatically detect and understand what the user is trying to ask, even with errors.\n"
        "Examples: 'invset' should be understood as 'invest', 'schmee' as 'scheme', 'taxx' as 'tax', 'loaan' as 'loan', 'budjet' as 'budget'.\n"
        "Intelligently correct and interpret the question, then answer the intended question.\n"
        "DO NOT point out the spelling mistakes - just understand the intent and answer naturally.\n"
        "Handle misspellings in ANY language intelligently.\n\n"
        "You must answer ONLY in the context of Indian financial literacy.\n"
        "Include government schemes, RBI guidelines, tax/loan implications, "
        "and practical next steps when relevant.\n\n"
        "FORMAT INSTRUCTIONS (follow exactly):\n"
        "1. Use `###` for section headings.\n"
        "2. Add ONE completely blank line after every heading.\n"
        "3. Add ONE completely blank line between every paragraph.\n"
        "4. Use bullet lists for steps, benefits, features, risks.\n"
        "5. Bold important terms using **bold**.\n"
        "6. NEVER output dense text or multiple sentences in one paragraph.\n"
        "7. If needed, use `<br>` ONLY to force spacing — but prefer blank lines.\n\n"
        "Important: Your answer must be clean, spacious, and easy to read.\n\n"
        "If the user greets you, reply warmly but still give one simple finance tip.\n\n"
        f"User question: {user_prompt}"
    )

    try:
        response = model.generate_content(final_prompt)
        return jsonify({"response": response.text})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)