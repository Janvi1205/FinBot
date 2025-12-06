from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

# ✅ Allowed topics list
ALLOWED_TOPICS = [
    "scheme", "yojana", "finance", "financial", "budget", "saving",
    "investment", "investing", "income tax", "mutual fund", "insurance",
    "rbi", "loan", "pf", "pension", "subsidy", "government benefit", "invest"
]

def is_relevant(message: str) -> bool:
    message = message.lower()
    return any(keyword in message for keyword in ALLOWED_TOPICS)


@app.post("/ask")
def ask():
    data = request.get_json(silent=True) or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # ✅ relevance check BEFORE calling Gemini
    if not is_relevant(user_prompt):
        return jsonify({
            "response":
            "I can answer only questions related to Indian financial literacy — "
            "like budgeting, saving, investing, RBI rules, loans, tax, and government schemes.\n\n"
            "Please ask something from these topics."
        })

    # If relevant → proceed normally
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
        "Important: Your answer must be clean, spacious, and easy to read. "
        "Spacing is mandatory.\n\n"
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
