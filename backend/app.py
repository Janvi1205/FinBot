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

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
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
        match = get_close_matches(word, ALLOWED_TOPICS, cutoff=0.7)
        if match:
            return True

    return False


@app.post("/ask")
def ask():
    data = request.get_json(silent=True) or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # 1️⃣ Greeting — Always allowed
    if is_greeting(user_prompt):
        user_prompt = f"{user_prompt}. Also give one simple Indian finance tip."

    # 2️⃣ Financial relevance check (fuzzy)
    elif not is_relevant(user_prompt):
        return jsonify({
            "response":
            "I can answer only questions related to Indian financial literacy — "
            "like budgeting, saving, investing, RBI rules, loans, tax, and government schemes.\n\n"
            "Please ask something from these topics."
        })

    # 3️⃣ If relevant → continue normally
    final_prompt = (
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