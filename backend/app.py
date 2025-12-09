from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from difflib import SequenceMatcher
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Config
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

# Core financial keywords
FINANCIAL_KEYWORDS = [
    "scheme", "yojana", "finance", "financial", "budget", "budgeting", "saving", "savings",
    "investment", "investing", "invest", "income", "tax", "mutual", "fund", "insurance",
    "rbi", "loan", "loans", "pf", "epf", "pension", "subsidy", "benefit", "benefits",
    "government", "bank", "banking", "credit", "debit", "stock", "stocks", "share", "shares",
    "equity", "debt", "nps", "ppf", "fd", "rd", "sip", "emi", "interest", "gst",
    "pan", "aadhar", "kyc", "neft", "rtgs", "upi", "money", "rupee", "currency",
    "retirement", "wealth", "inflation", "dividend", "capital", "asset", "liability",
    "emergency", "portfolio", "diversification", "risk", "return", "profit", "loss",
    "salary", "pay", "payment", "expense", "expenses", "cost", "price", "afford"
]

# Greeting words
GREETINGS = [
    "hi", "hello", "hey", "hii", "hiii", "yo", "namaste", "hola", "sup", "wassup",
    "good morning", "good afternoon", "good evening", "greetings", "howdy",
    "helo", "hiiii", "hiiiii"
]

# Similarity function
def similarity_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


# Greeting detection
def is_greeting(message: str) -> bool:
    msg = message.lower().strip()
    msg_clean = re.sub(r"[^\w\s]", "", msg)

    if msg_clean in GREETINGS:
        return True

    for word in msg_clean.split():
        for greeting in GREETINGS:
            if similarity_ratio(word, greeting) > 0.8:
                return True

    return False


# Finance relevance detection
def is_relevant(message: str) -> bool:
    msg_clean = re.sub(r"[^\w\s]", "", message.lower())
    words = msg_clean.split()

    for word in words:

        if len(word) <= 2 and word not in ["pf", "fd", "rd", "gst", "upi", "epf", "pan"]:
            continue

        for keyword in FINANCIAL_KEYWORDS:
            similarity = similarity_ratio(word, keyword)

            if len(word) <= 3:
                threshold = 0.7
            elif len(word) <= 5:
                threshold = 0.6
            else:
                threshold = 0.55

            if similarity >= threshold:
                print(f"✅ Matched: '{word}' → '{keyword}' (similarity: {similarity:.2f})")
                return True

    # Pattern-based finance detection
    finance_patterns = [
        r"\b(how|what|why|when|where)\b.*(money|save|invest|loan|tax|bank)",
        r"\b(pm|pradhan mantri|government)\b",
        r"\b\d+\s*(lakh|crore|rupee|rs|inr)\b",
    ]

    for pattern in finance_patterns:
        if re.search(pattern, msg_clean):
            print(f"✅ Matched pattern: {pattern}")
            return True

    print(f"❌ No match found for: {message}")
    return False


# -------------------------
# 🚀 Main API Route
# -------------------------
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True) or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    print(f"\n📩 Received: {user_prompt}")

    is_greeting_msg = is_greeting(user_prompt)
    is_finance_related = is_relevant(user_prompt)

    # -------------------------
    # 1️⃣ Greeting Response
    # -------------------------
    if is_greeting_msg:
        print("✅ Detected as greeting")

        final_prompt = (
            "You are FinBot, a friendly Indian financial literacy assistant.\n\n"
            f"The user said: '{user_prompt}'\n\n"
            "Respond warmly to their greeting. Introduce yourself briefly and share "
            "ONE simple, actionable financial tip relevant to Indian users.\n\n"
            "VERY IMPORTANT: Respond in the SAME LANGUAGE the user used.\n\n"
            
            "Keep it conversational with proper spacing."
        )

    # -------------------------
    # 2️⃣ Finance Related Query
    # -------------------------
    elif is_finance_related:
        print("✅ Detected as finance-related")

        final_prompt = (
            "You are FinBot, an expert in Indian financial literacy.\n\n"
            "Answer ONLY in the context of Indian finance:\n"
            "- Government schemes (PM-KISAN, Ayushman Bharat, etc.)\n"
            "- RBI rules and banking guidelines\n"
            "- Tax (Income Tax, GST)\n"
            "- Loans, insurance, PPF, NPS, mutual funds, stocks\n"
            "- Budgeting, saving, financial planning\n\n"
            "VERY IMPORTANT RULE:\n"
            "→ ALWAYS respond in the SAME LANGUAGE the user used.\n\n"
            "FORMAT:\n"
            "1. Use `###` for headings\n"
            "2. Add one blank line after each heading\n"
            "3. Add spacing between paragraphs\n"
            "4. Use bullet points for steps, benefits, features, risks\n"
            "5. Bold important terms using **bold**\n"
            "6. Keep paragraphs short and easy to read\n\n"
            f"User question: {user_prompt}"
        )

    # -------------------------
    # 3️⃣ Off-topic Query
    # -------------------------
    else:
        print("❌ Not finance-related")
        return jsonify({
            "response": (
                "I'm **FinBot**, your Indian financial literacy assistant! 💰\n\n"
                "I respond in the same language you use. 😊\n\n"
                "I can help with:\n"
                "- Budgeting & Savings\n"
                "- Investments (Mutual Funds, Stocks, PPF, NPS)\n"
                "- Government Schemes\n"
                "- Loans & Insurance\n"
                "- Income Tax & GST\n"
                "- RBI Banking Rules\n\n"
                "Ask me anything related to these topics!"
            )
        })

    # -------------------------
    #  Generate Response
    # -------------------------
    try:
        response = model.generate_content(final_prompt)
        print("✅ Response generated successfully")
        return jsonify({"response": response.text})

    except Exception as exc:
        print(f"❌ Error generating response: {exc}")
        return jsonify({"error": f"Failed to generate response: {str(exc)}"}), 500


# Health check
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": GEMINI_MODEL})


# App Runner
if __name__ == "__main__":
    app.run(debug=True)
