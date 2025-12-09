from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from difflib import SequenceMatcher
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
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
    "good morning", "good afternoon", "good evening", "greetings", "howdy", "helo","hiiii","hiiiii"
]


def similarity_ratio(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def is_greeting(message: str) -> bool:
    """Check if message is a greeting"""
    msg = message.lower().strip()
    msg_clean = re.sub(r'[^\w\s]', '', msg)
    
    # Check exact match
    if msg_clean in GREETINGS:
        return True
    
    # Check if any word is a greeting (with high similarity)
    words = msg_clean.split()
    for word in words:
        for greeting in GREETINGS:
            if similarity_ratio(word, greeting) > 0.8:
                return True
    
    return False


def is_relevant(message: str) -> bool:
    """
    Enhanced fuzzy matching for financial relevance.
    Uses character-level similarity to catch severe misspellings like:
    - shchme → scheme
    - invset → invest
    - ln → loan
    - finace → finance
    """
    # Clean the message
    msg_clean = re.sub(r'[^\w\s]', '', message.lower())
    words = msg_clean.split()
    
    # Check each word against financial keywords
    for word in words:
        # Skip very short words (unless they're common abbreviations)
        if len(word) <= 2 and word not in ["pf", "fd", "rd", "gst", "upi", "epf", "pan"]:
            continue
        
        # Check similarity with each financial keyword
        for keyword in FINANCIAL_KEYWORDS:
            # Use lower threshold for better matching
            similarity = similarity_ratio(word, keyword)
            
            # Adjust threshold based on word length
            if len(word) <= 3:
                threshold = 0.7  # Stricter for short words
            elif len(word) <= 5:
                threshold = 0.6  # Medium threshold
            else:
                threshold = 0.55  # More lenient for longer words
            
            if similarity >= threshold:
                print(f"✅ Matched: '{word}' → '{keyword}' (similarity: {similarity:.2f})")
                return True
    
    # Check for common finance-related patterns
    finance_patterns = [
        r'\b(how|what|why|when|where)\b.*(money|save|invest|loan|tax|bank)',
        r'\b(pm|pradhan mantri|government)\b',
        r'\b\d+\s*(lakh|crore|rupee|rs|inr)\b',
    ]
    
    for pattern in finance_patterns:
        if re.search(pattern, msg_clean):
            print(f"✅ Matched pattern: {pattern}")
            return True
    
    print(f"❌ No match found for: {message}")
    return False


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True) or {}
    user_prompt = data.get("prompt", "").strip()

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    print(f"\n📩 Received: {user_prompt}")

    
    is_greeting_msg = is_greeting(user_prompt)
    
   
    is_finance_related = is_relevant(user_prompt)

    # 1️⃣ Handle greetings - always allow
    if is_greeting_msg:
        print("✅ Detected as greeting")
        final_prompt = (
            "You are FinBot, a friendly Indian financial literacy assistant.\n\n"
            f"The user said: '{user_prompt}'\n\n"
            "Respond warmly to their greeting, introduce yourself briefly, "
            "and share ONE simple, actionable financial tip relevant to Indian users "
            "(like using UPI, starting a PPF, or tracking expenses).\n\n"
            "Keep it conversational and encouraging. Use proper spacing with blank lines."
        )
    
    # 2️⃣ Finance-related question - proceed normally
    elif is_finance_related:
        print("✅ Detected as finance-related")
        final_prompt = (
            "You are FinBot, an expert in Indian financial literacy.\n\n"
            "Answer ONLY in the context of Indian finance, including:\n"
            "- Government schemes (PM-KISAN, Sukanya Samriddhi, Ayushman Bharat, etc.)\n"
            "- RBI guidelines and banking rules\n"
            "- Tax implications (Income Tax, GST)\n"
            "- Loans, insurance, investments (PPF, NPS, mutual funds, stocks)\n"
            "- Budgeting, savings, and financial planning\n\n"
            "FORMAT INSTRUCTIONS (follow exactly):\n"
            "1. Use `###` for section headings\n"
            "2. Add ONE blank line after every heading\n"
            "3. Add ONE blank line between paragraphs\n"
            "4. Use bullet lists for steps, benefits, features, risks\n"
            "5. Bold important terms using **bold**\n"
            "6. Keep paragraphs short (2-3 sentences max)\n"
            "7. Make it easy to read and well-spaced\n\n"
            f"User question: {user_prompt}"
        )
    
    # 3️⃣ Off-topic question - politely decline
    else:
        print("❌ Not finance-related")
        return jsonify({
            "response": (
                "I'm **FinBot**, your Indian financial literacy assistant! 💰\n\n"
                "I can help with:\n\n"
                "- **Budgeting & Savings** 💸\n"
                "- **Investments** (mutual funds, stocks, PPF, NPS) 📈\n"
                "- **Government Schemes** (PM-KISAN, Ayushman Bharat, etc.) 🏛️\n"
                "- **Loans & Insurance** 🏦\n"
                "- **Income Tax & GST** 📋\n"
                "- **RBI Rules & Banking** 🏛️\n\n"
                "Please ask me something related to these topics! 😊"
            )
        }), 200

    # Generate response from Gemini
    try:
        response = model.generate_content(final_prompt)
        print("✅ Response generated successfully")
        return jsonify({"response": response.text})
    except Exception as exc:
        print(f"❌ Error generating response: {exc}")
        return jsonify({"error": f"Failed to generate response: {str(exc)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": GEMINI_MODEL})


if __name__ == "__main__":
    app.run(debug=True)