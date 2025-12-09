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
    raise RuntimeError("❌ GEMINI_API_KEY is not set. Add it to backend/.env")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

print("✅ Flask server started successfully")
print(f"✅ Using model: {GEMINI_MODEL}")

# Core financial keywords (English + Hindi/Regional)
FINANCIAL_KEYWORDS = [
    # English
    "scheme", "yojana", "finance", "financial", "budget", "budgeting", "saving", "savings",
    "investment", "investing", "invest", "income", "tax", "mutual", "fund", "insurance",
    "rbi", "loan", "loans", "pf", "epf", "pension", "subsidy", "benefit", "benefits",
    "government", "bank", "banking", "credit", "debit", "stock", "stocks", "share", "shares",
    "equity", "debt", "nps", "ppf", "fd", "rd", "sip", "emi", "interest", "gst",
    "pan", "aadhar", "kyc", "neft", "rtgs", "upi", "money", "rupee", "currency",
    "retirement", "wealth", "inflation", "dividend", "capital", "asset", "liability",
    "emergency", "portfolio", "diversification", "risk", "return", "profit", "loss",
    "salary", "pay", "payment", "expense", "expenses", "cost", "price", "afford",
    
    # Hindi/Regional keywords (Transliterated)
    "paisa", "paise", "bachat", "nivesh", "karza", "karz", "rin", "beema", "sarkar",
    "sarkari", "yojana", "kendra", "kendriya", "pradhan", "mantri", "bharat", "rashtriya",
    "mudra", "jan", "dhan", "atal", "samriddhi", "kisan", "ayushman", "sukanya"
]

# Greeting words (English + Hindi/Regional)
GREETINGS = [
    # English
    "hi", "hello", "hey", "hii", "hiii", "hiiii", "hiiiii", "yo", "sup", "wassup",
    "good morning", "good afternoon", "good evening", "greetings", "howdy", "helo",
    
    # Hindi/Regional
    "namaste", "namaskar", "pranam", "hola", "vanakkam", "namaskara", "namaskaram",
    "sat sri akal", "sasriakal", "kem cho", "kemcho", "ram ram", "radhe radhe"
]

# Common Hindi/Regional script patterns for detection
INDIAN_SCRIPT_PATTERNS = [
    r'[\u0900-\u097F]',  # Devanagari (Hindi, Marathi, Sanskrit)
    r'[\u0980-\u09FF]',  # Bengali
    r'[\u0A00-\u0A7F]',  # Gurmukhi (Punjabi)
    r'[\u0A80-\u0AFF]',  # Gujarati
    r'[\u0B00-\u0B7F]',  # Oriya
    r'[\u0B80-\u0BFF]',  # Tamil
    r'[\u0C00-\u0C7F]',  # Telugu
    r'[\u0C80-\u0CFF]',  # Kannada
    r'[\u0D00-\u0D7F]',  # Malayalam
]


def detect_language(message: str) -> str:
    """
    Detect if the message is in an Indian language or English.
    Returns: 'hindi', 'regional', or 'english'
    """
    # Check for Indian scripts
    for pattern in INDIAN_SCRIPT_PATTERNS:
        if re.search(pattern, message):
            # If Devanagari, likely Hindi
            if re.search(r'[\u0900-\u097F]', message):
                return 'hindi'
            return 'regional'
    
    # Check for common Hindi/Regional transliterated words
    hindi_words = [
        'kya', 'hai', 'kaise', 'kahan', 'kyun', 'kaun', 'kitna', 'kitne',
        'mujhe', 'mere', 'mera', 'aap', 'aapka', 'hum', 'humara', 'tum',
        'paisa', 'paise', 'rupaye', 'lakh', 'crore', 'karze', 'bachat',
        'nivesh', 'sarkari', 'yojana', 'scheme', 'matlab', 'batao', 'bataye'
    ]
    
    msg_lower = message.lower()
    for word in hindi_words:
        if word in msg_lower:
            return 'hindi'
    
    return 'english'


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
    Now supports Hindi/Regional language keywords too.
    """
    # Clean the message
    msg_clean = re.sub(r'[^\w\s\u0900-\u0D7F]', '', message.lower())  # Keep Indian scripts
    words = msg_clean.split()
    
    # Check each word against financial keywords
    for word in words:
        # Skip very short words (unless they're common abbreviations)
        if len(word) <= 2 and word not in ["pf", "fd", "rd", "gst", "upi", "epf", "pan"]:
            continue
        
        # Check similarity with each financial keyword
        for keyword in FINANCIAL_KEYWORDS:
            similarity = similarity_ratio(word, keyword)
            
            # Adjust threshold based on word length
            if len(word) <= 3:
                threshold = 0.7
            elif len(word) <= 5:
                threshold = 0.6
            else:
                threshold = 0.55
            
            if similarity >= threshold:
                print(f"✅ Matched: '{word}' → '{keyword}' (similarity: {similarity:.2f})")
                return True
    
    # Check for common finance-related patterns
    finance_patterns = [
        r'\b(how|what|why|when|where|kya|kaise|kahan|kyun)\b.*(money|save|invest|loan|tax|bank|paisa|bachat|nivesh|karza)',
        r'\b(pm|pradhan mantri|government|sarkar|sarkari)\b',
        r'\b\d+\s*(lakh|crore|rupee|rupaye|rs|inr)\b',
    ]
    
    for pattern in finance_patterns:
        if re.search(pattern, msg_clean):
            print(f"✅ Matched pattern: {pattern}")
            return True
    
    # Check for Indian script (likely finance-related if combined with numbers or common words)
    for pattern in INDIAN_SCRIPT_PATTERNS:
        if re.search(pattern, message):
            print(f"✅ Detected Indian script - assuming finance-related")
            return True
    
    return False


@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json(silent=True) or {}
        user_prompt = data.get("prompt", "").strip()

        if not user_prompt:
            return jsonify({"error": "Prompt is required"}), 400

        print(f"\n{'='*60}")
        print(f"📩 Received: '{user_prompt}'")
        
        # Detect language
        detected_language = detect_language(user_prompt)
        print(f"🌐 Detected language: {detected_language}")
        print(f"{'='*60}")

        # Check if it's a greeting
        is_greeting_msg = is_greeting(user_prompt)
        print(f"🔍 Is greeting? {is_greeting_msg}")
        
        # Check if it's finance-related
        is_finance_related = is_relevant(user_prompt)
        print(f"🔍 Is finance-related? {is_finance_related}")

        # Prepare language instruction based on detection
        if detected_language == 'hindi':
            language_instruction = "Respond in Hindi (Devanagari script or Romanized Hindi). "
        elif detected_language == 'regional':
            language_instruction = "Respond in the same regional Indian language the user used. "
        else:
            language_instruction = "Respond in English. "

        # 1️⃣ Handle greetings - always allow
        if is_greeting_msg:
            print("✅ GREETING DETECTED - Generating greeting response")
            final_prompt = (
                f"You are FinBot, a friendly Indian financial literacy assistant.\n\n"
                f"{language_instruction}\n\n"
                f"The user said: '{user_prompt}'\n\n"
                f"Respond warmly to their greeting in the SAME language they used, introduce yourself briefly, "
                f"and share ONE simple, actionable financial tip relevant to Indian users "
                f"(like using UPI, starting a PPF, or tracking expenses).\n\n"
                f"Keep it conversational and encouraging. Use proper spacing with blank lines."
            )
        
        # 2️⃣ Finance-related question - proceed normally
        elif is_finance_related:
            print("✅ FINANCE QUESTION DETECTED - Generating detailed response")
            final_prompt = (
                f"You are FinBot, an expert in Indian financial literacy.\n\n"
                f"{language_instruction}\n\n"
                f"Answer ONLY in the context of Indian finance, including:\n"
                f"- Government schemes (PM-KISAN, Sukanya Samriddhi, Ayushman Bharat, etc.)\n"
                f"- RBI guidelines and banking rules\n"
                f"- Tax implications (Income Tax, GST)\n"
                f"- Loans, insurance, investments (PPF, NPS, mutual funds, stocks)\n"
                f"- Budgeting, savings, and financial planning\n\n"
                f"FORMAT INSTRUCTIONS (follow exactly):\n"
                f"1. Use `###` for section headings\n"
                f"2. Add ONE blank line after every heading\n"
                f"3. Add ONE blank line between paragraphs\n"
                f"4. Use bullet lists for steps, benefits, features, risks\n"
                f"5. Bold important terms using **bold**\n"
                f"6. Keep paragraphs short (2-3 sentences max)\n"
                f"7. Make it easy to read and well-spaced\n\n"
                f"User question: {user_prompt}"
            )
        
        # 3️⃣ Off-topic question - politely decline (in detected language)
        else:
            print("❌ OFF-TOPIC - Returning rejection message")
            
            if detected_language == 'hindi':
                response_text = (
                    "मैं **FinBot** हूं, आपका भारतीय वित्तीय साक्षरता सहायक! 💰\n\n"
                    "मैं इन विषयों में मदद कर सकता हूं:\n\n"
                    "- **बजट और बचत** 💸\n"
                    "- **निवेश** (म्यूचुअल फंड, स्टॉक, PPF, NPS) 📈\n"
                    "- **सरकारी योजनाएं** (PM-KISAN, आयुष्मान भारत, आदि) 🏛️\n"
                    "- **लोन और बीमा** 🏦\n"
                    "- **इनकम टैक्स और GST** 📋\n"
                    "- **RBI नियम और बैंकिंग** 🏛️\n\n"
                    "कृपया इन विषयों से संबंधित कुछ पूछें! 😊"
                )
            else:
                response_text = (
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
            
            return jsonify({"response": response_text}), 200

        # Generate response from Gemini
        print("🤖 Calling Gemini API...")
        print(f"📝 Prompt length: {len(final_prompt)} characters")
        
        response = model.generate_content(final_prompt)
        
        if not response or not response.text:
            print("❌ ERROR: Gemini returned empty response")
            return jsonify({
                "response": "I'm having trouble generating a response right now. Please try again!"
            }), 200
        
        print(f"✅ Gemini response received: {len(response.text)} characters")
        print(f"📤 Sending response to frontend")
        
        return jsonify({"response": response.text}), 200
        
    except Exception as exc:
        print(f"❌ CRITICAL ERROR in /ask endpoint:")
        print(f"❌ Error type: {type(exc).__name__}")
        print(f"❌ Error message: {str(exc)}")
        import traceback
        print(f"❌ Traceback:")
        traceback.print_exc()
        
        return jsonify({
            "response": "I encountered an error while processing your request. Please try again or rephrase your question."
        }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok", 
        "model": GEMINI_MODEL,
        "api_configured": bool(GEMINI_API_KEY)
    })


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting FinBot Flask Server (Multi-Language Support)")
    print("="*60)
    app.run(debug=True, host="0.0.0.0", port=5000)