"""
AIDR-Protected AI Chatbot
Flask backend with CrowdStrike AIDR guardrails and multi-provider LLM support.
"""

import os
import json
import uuid
import traceback
from datetime import datetime, timezone
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-me")

# ---------------------------------------------------------------------------
# AIDR Client Setup
# ---------------------------------------------------------------------------
aidr_client = None

def init_aidr():
    """Initialize the CrowdStrike AIDR client."""
    global aidr_client
    token = os.getenv("AIDR_TOKEN", "").strip()
    if not token:
        print("[AIDR] ⚠️  No AIDR token configured. Enter one via Settings in the UI.")
        aidr_client = None
        return
    try:
        from crowdstrike_aidr import AIGuard
        aidr_client = AIGuard(
            base_url_template=os.getenv("AIDR_BASE_URL", "https://api.us-2.crowdstrike.com/aidr/aiguard"),
            token=token,
        )
        print("[AIDR] ✅ AIGuard client initialized successfully.")
    except Exception as e:
        print(f"[AIDR] ⚠️  Failed to initialize AIGuard: {e}")
        print("[AIDR] The chatbot will operate WITHOUT AIDR protection.")
        aidr_client = None

init_aidr()

# ---------------------------------------------------------------------------
# Chat Session Store (persisted to chat_history.json)
# ---------------------------------------------------------------------------
HISTORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_history.json")


def _load_chat_sessions():
    """Load chat sessions from disk."""
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[HISTORY] ⚠️  Could not load chat_history.json: {e}")
    return {}


def _save_chat_sessions():
    """Persist chat sessions to disk."""
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(chat_sessions, f, indent=2, default=str)
    except Exception as e:
        print(f"[HISTORY] ⚠️  Could not save chat_history.json: {e}")


chat_sessions = _load_chat_sessions()  # chat_id -> session dict

# ---------------------------------------------------------------------------
# Persona System Prompts
# ---------------------------------------------------------------------------
PERSONAS = {
    "customer_support": {
        "name": "Customer Support",
        "system_prompt": (
            "You are Aria, the virtual customer support assistant for Nimbus, a company "
            "that sells consumer electronics and subscription services. You are warm, "
            "patient, and upbeat, and you genuinely enjoy helping customers get unstuck. "
            "Your areas of responsibility are: order status and tracking, shipping and "
            "delivery questions, returns and exchanges, billing and subscription management, "
            "product troubleshooting, warranty claims, and general product information. "
            "Always acknowledge the customer's frustration when something has gone wrong, "
            "apologize sincerely for any friction, and clearly explain the next step you or "
            "they will take. Keep answers concise and structured — use short paragraphs or "
            "numbered steps for multi-step instructions. If a request falls outside standard "
            "policy (for example a refund beyond the return window), explain the policy and "
            "offer to escalate to a human support specialist. Do not give legal, medical, or "
            "financial advice. If the customer asks about something unrelated to Nimbus "
            "products or services, politely steer the conversation back to how you can help "
            "with their account or order. End interactions by checking whether there is "
            "anything else you can help with."
        ),
    },
    "security_qa": {
        "name": "Security Q&A",
        "system_prompt": (
            "You are Sentinel, a senior security analyst assistant built to support SOC "
            "teams, security engineers, and IT administrators. You are precise, calm, and "
            "pragmatic — you communicate like an experienced analyst briefing a colleague. "
            "Your areas of responsibility are: threat intelligence and emerging threats, "
            "detection engineering, incident response procedures, vulnerability management "
            "and prioritization, cloud and endpoint security, and compliance frameworks. "
            "Ground your advice in industry standards, referencing NIST, MITRE ATT&CK "
            "techniques, and CIS Controls when relevant, and be explicit about severity, "
            "likelihood, and trade-offs. Prefer actionable guidance: concrete detection "
            "ideas, containment steps, and hardening measures rather than generic advice. "
            "When discussing an attack technique, focus on how to detect and defend against "
            "it. Never provide working exploit code, offensive tooling instructions, or "
            "step-by-step guidance for compromising systems — redirect such requests toward "
            "defensive measures instead. If a question is outside security (for example "
            "general IT support), give a brief pointer and return to your security focus. "
            "Ask clarifying questions when an incident description is too vague to act on."
        ),
    },
    "banking": {
        "name": "Banking Assistant",
        "system_prompt": (
            "You are Penny, the virtual banking assistant for Meridian Bank, a retail bank "
            "serving personal and small-business customers. You are professional, reassuring, "
            "and clear — customers should feel their money is in safe, competent hands. "
            "Your areas of responsibility are: checking and savings accounts, debit and "
            "credit cards, payments and transfers, loans and mortgages, savings and deposit "
            "products, fraud and lost-card reporting, and help using the mobile app, online "
            "banking, branches, and ATMs. Explain financial terms in plain language, define "
            "jargon the first time you use it, and use short worked examples for concepts "
            "like interest or amortization. Never ask for, repeat, or confirm sensitive "
            "credentials — PINs, passwords, one-time passcodes, full card numbers, or full "
            "account numbers — and if a customer volunteers them, tell them not to share "
            "those in chat and continue without them. For anything requiring authentication "
            "or account-specific data, direct the customer to the secure mobile app, online "
            "banking, or a branch. Treat reports of fraud, stolen cards, or unauthorized "
            "transactions as urgent: give immediate steps first (freeze the card in the app, "
            "call the 24/7 hotline), then explain what happens next. Do not give personalized "
            "investment, tax, or legal advice — explain products and concepts in general "
            "terms and recommend a licensed advisor for individual decisions. If a question "
            "is unrelated to banking, politely bring the conversation back to how you can "
            "help with their banking needs."
        ),
    },
    "healthcare": {
        "name": "Healthcare Assistant",
        "system_prompt": (
            "You are Ivy, the patient-services assistant for Lakeside Health, a network of "
            "community clinics. You are compassionate, calm, and non-judgmental, and you "
            "communicate in plain, health-literate language that never talks down to "
            "patients. Your areas of responsibility are: explaining how to schedule, "
            "reschedule, or prepare for appointments; clinic locations, hours, and services; "
            "insurance and billing basics such as copays, deductibles, and coverage "
            "questions; the prescription-refill process; what to expect from common visits, "
            "tests, and procedures; and general wellness and preventive-care education. "
            "You do not diagnose conditions, prescribe or adjust medications, or interpret "
            "an individual's symptoms, lab results, or imaging — when patients ask, explain "
            "gently that a clinician needs to evaluate them and help them get an appointment "
            "instead. If someone describes a potential emergency such as chest pain, "
            "difficulty breathing, stroke symptoms, or thoughts of self-harm, tell them "
            "immediately and clearly to call 911 or go to the nearest emergency room before "
            "anything else. Never request full Social Security numbers, insurance member "
            "IDs, or detailed medical records in chat; for anything involving personal "
            "health information, direct patients to the secure patient portal or the front "
            "desk. Be sensitive to worry — acknowledge concerns before giving information. "
            "If a question is unrelated to Lakeside Health or general wellness, kindly steer "
            "the conversation back to how you can help with their care."
        ),
    },
    "education": {
        "name": "Education Assistant",
        "system_prompt": (
            "You are Sage, the learning assistant for Brightpath Academy, an online learning "
            "platform for students from middle school through adult learners. You are "
            "encouraging, patient, and endlessly curious, and you believe every student can "
            "learn with the right explanation. Your areas of responsibility are: explaining "
            "concepts across subjects such as math, science, history, and writing; guiding "
            "students through homework step by step; building study plans and schedules; "
            "exam preparation and practice questions; feedback on outlines and drafts; and "
            "helping students navigate Brightpath courses and features. Teach Socratically: "
            "rather than handing over answers, break problems into steps, ask guiding "
            "questions, and let the student attempt each step before revealing it. Adapt "
            "your vocabulary and depth to the student's apparent level, and check "
            "understanding by asking them to restate ideas or try a similar problem. "
            "Celebrate progress specifically — point out what the student did well and why "
            "it worked. Do not write essays, assignments, or take-home test answers for "
            "students to submit as their own; instead help them brainstorm, outline, and "
            "revise their own work, and be transparent about that boundary. Keep all content "
            "age-appropriate for a school setting. For questions about grades, enrollment, "
            "or account issues, direct students to their teacher or Brightpath support. If "
            "a topic is unrelated to learning, gently guide the student back to their "
            "studies."
        ),
    },
}

# ---------------------------------------------------------------------------
# Default model lists per provider
# ---------------------------------------------------------------------------
DEFAULT_MODELS = {
    "openai": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    "gemini": ["gemma-4-26b-a4b-it", "gemini-3.1-flash-lite", "gemma-4-31b-it"],
    "ollama": [],  # Fetched dynamically from the Ollama instance
}

# ---------------------------------------------------------------------------
# AIDR Guard Helpers
# ---------------------------------------------------------------------------
def aidr_guard(messages, event_type):
    """
    Run CrowdStrike AIDR guard on messages.
    Returns (is_blocked: bool, details: dict).

    Response structure (from SDK):
      response.status         -> "Success"
      response.result.blocked -> True/False
      response.result.policy  -> policy name that triggered
      response.result.detectors -> detector details
      response.result.guard_output -> transformed/redacted content
    """
    if aidr_client is None:
        return False, {"status": "aidr_unavailable"}

    try:
        response = aidr_client.guard_chat_completions(
            guard_input={"messages": messages},
            event_type=event_type,
        )

        # Access the result object
        result = getattr(response, "result", None)
        if result is None:
            return False, {"status": "allowed", "raw_status": getattr(response, "status", "unknown")}

        is_blocked = getattr(result, "blocked", False) or False
        policy = getattr(result, "policy", None)
        detectors = getattr(result, "detectors", None)
        transformed = getattr(result, "transformed", False)

        if is_blocked:
            return True, {
                "status": "blocked",
                "policy": policy or "Policy violation detected",
                "detectors": str(detectors) if detectors else None,
                "transformed": transformed,
            }

        return False, {
            "status": "allowed",
            "transformed": transformed,
            "policy": policy,
        }
    except Exception as e:
        print(f"[AIDR] Guard error ({event_type}): {e}")
        traceback.print_exc()
        # Fail open — let the message through if AIDR is unreachable
        return False, {"status": "aidr_error", "error": str(e)}

# ---------------------------------------------------------------------------
# LLM Provider Handlers
# ---------------------------------------------------------------------------
def call_openai(messages, api_key, model):
    """Call OpenAI Chat Completions API."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=2048,
    )
    return response.choices[0].message.content


def call_anthropic(messages, api_key, model):
    """Call Anthropic Messages API."""
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    # Extract system prompt from messages
    system_prompt = ""
    user_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_prompt = msg["content"]
        else:
            user_messages.append(msg)

    response = client.messages.create(
        model=model,
        max_tokens=2048,
        system=system_prompt,
        messages=user_messages,
    )
    return response.content[0].text


def call_gemini(messages, api_key, model):
    """Call Google Gemini API using the new google-genai library."""
    import time
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    contents = []
    system_instruction = None

    for msg in messages:
        if msg["role"] == "system":
            system_instruction = msg["content"]
        else:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

    # Gemma models don't support system_instruction — prepend as a user turn instead
    is_gemma = model.lower().startswith("gemma")

    if is_gemma and system_instruction:
        # Insert system prompt as the first user message
        contents.insert(0, types.Content(
            role="user",
            parts=[types.Part.from_text(text=f"[System Instructions]\n{system_instruction}")]
        ))
        # Gemma expects alternating user/model turns, add a model acknowledgement
        contents.insert(1, types.Content(
            role="model",
            parts=[types.Part.from_text(text="Understood. I will follow these instructions.")]
        ))
        config = None
    else:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
        ) if system_instruction else None

    # Retry logic for transient 500 errors from the Gemini API
    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            return response.text
        except Exception as e:
            last_error = e
            error_str = str(e)

            # Don't retry client errors — only transient server errors
            if "404" in error_str or "not found" in error_str.lower():
                raise ValueError(
                    f"Model '{model}' was not found. Please check your Gemini API key has access to this model."
                )
            elif "401" in error_str or "403" in error_str or "API key" in error_str.lower():
                raise ValueError(
                    "Invalid or missing Gemini API key. Please check your API key in Settings."
                )
            elif "500" in error_str or "internal" in error_str.lower():
                # Transient server error — retry with backoff
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # 2s, 4s
                    print(f"[Gemini] ⚠️  500 error on attempt {attempt + 1}/{max_retries}, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise
            else:
                raise

    # Should not reach here, but just in case
    raise last_error


def call_ollama(messages, ollama_url, model):
    """Call a self-hosted Ollama instance (OpenAI-compatible API)."""
    from openai import OpenAI
    base_url = f"{ollama_url.rstrip('/')}/v1"
    client = OpenAI(base_url=base_url, api_key="ollama")  # Ollama doesn't need a real key
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=2048,
    )
    return response.choices[0].message.content


# Provider dispatcher
PROVIDERS = {
    "openai": call_openai,
    "anthropic": call_anthropic,
    "gemini": call_gemini,
    "ollama": call_ollama,
}


def call_llm(messages, settings):
    """Route to the correct LLM provider based on user settings."""
    provider = settings.get("provider", "openai")
    model = settings.get("model", "gpt-4o-mini")
    api_key = settings.get("api_key", "")
    ollama_url = settings.get("ollama_url", "http://localhost:11434")

    if provider == "ollama":
        return call_ollama(messages, ollama_url, model)
    elif provider in PROVIDERS:
        return PROVIDERS[provider](messages, api_key, model)
    else:
        raise ValueError(f"Unknown provider: {provider}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.before_request
def ensure_session_id():
    """Ensure every request has a session_id for authorization tracking."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())


@app.route("/")
def index():
    """Serve the chat page."""
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Chat Session CRUD
# ---------------------------------------------------------------------------
@app.route("/api/chats", methods=["GET"])
def list_chats():
    """Return all chat sessions for the current user (metadata only, no messages)."""
    chats = []
    user_id = session.get("session_id")
    for cid, s in chat_sessions.items():
        # IDOR fix: Only return chats belonging to the current user (or legacy chats with no user_id if we want to be lenient, but we'll enforce it here)
        if s.get("user_id") != user_id:
            continue
        chats.append({
            "id": cid,
            "title": s.get("title", "New Chat"),
            "persona": s.get("persona", "customer_support"),
            "aidr_triggered": s.get("aidr_triggered", False),
            "aidr_block_count": s.get("aidr_block_count", 0),
            "message_count": len(s.get("messages", [])),
            "created_at": s.get("created_at"),
            "updated_at": s.get("updated_at"),
        })
    # Sort by updated_at descending (most recent first)
    chats.sort(key=lambda c: c.get("updated_at") or "", reverse=True)
    return jsonify({"chats": chats})


@app.route("/api/chats", methods=["POST"])
def create_chat():
    """Create a new chat session."""
    chat_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    persona_key = session.get("persona", "customer_support")
    chat_sessions[chat_id] = {
        "id": chat_id,
        "user_id": session.get("session_id"), # IDOR fix: associate chat with user
        "title": "New Chat",
        "messages": [],
        "persona": persona_key,
        "aidr_triggered": False,
        "aidr_block_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    # Set as active chat
    session["active_chat_id"] = chat_id
    _save_chat_sessions()
    return jsonify({"id": chat_id, "title": "New Chat", "persona": persona_key})


@app.route("/api/chats/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    """Load a specific chat session with full messages."""
    s = chat_sessions.get(chat_id)
    if not s or s.get("user_id") != session.get("session_id"):
        return jsonify({"error": "Chat not found"}), 404
    session["active_chat_id"] = chat_id
    return jsonify(s)


@app.route("/api/chats/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    """Delete a chat session."""
    s = chat_sessions.get(chat_id)
    if not s or s.get("user_id") != session.get("session_id"):
        return jsonify({"error": "Chat not found"}), 404

    del chat_sessions[chat_id]
    _save_chat_sessions()
    # If this was the active chat, clear it
    if session.get("active_chat_id") == chat_id:
        session.pop("active_chat_id", None)
    return jsonify({"status": "ok"})


@app.route("/api/chats/<chat_id>/rename", methods=["POST"])
def rename_chat(chat_id):
    """Rename a chat session."""
    s = chat_sessions.get(chat_id)
    if not s or s.get("user_id") != session.get("session_id"):
        return jsonify({"error": "Chat not found"}), 404
    data = request.json or {}
    new_title = data.get("title", "").strip()
    if not new_title:
        return jsonify({"error": "Title is required"}), 400
    s["title"] = new_title[:80]
    _save_chat_sessions()
    return jsonify({"status": "ok", "title": s["title"]})


@app.route("/api/aidr-status", methods=["GET"])
def aidr_status():
    """Return whether AIDR is currently configured and connected."""
    return jsonify({
        "configured": aidr_client is not None,
    })


@app.route("/api/aidr-config", methods=["POST"])
def aidr_config():
    """Accept AIDR token + base URL from the UI and reinitialize the client."""
    global aidr_client
    data = request.json or {}
    token = data.get("token", "").strip()
    base_url = data.get("base_url", "").strip()

    if not token:
        return jsonify({"error": "AIDR token is required."}), 400

    if not base_url:
        base_url = os.getenv("AIDR_BASE_URL", "https://api.us-2.crowdstrike.com/aidr/aiguard")

    try:
        from crowdstrike_aidr import AIGuard
        aidr_client = AIGuard(
            base_url_template=base_url,
            token=token,
        )
        # Persist to env vars for this process (not to .env file)
        os.environ["AIDR_TOKEN"] = token
        os.environ["AIDR_BASE_URL"] = base_url
        print("[AIDR] ✅ AIGuard client re-initialized from UI settings.")
        return jsonify({"status": "ok", "configured": True})
    except Exception as e:
        print(f"[AIDR] ⚠️  Failed to re-initialize AIGuard from UI: {e}")
        return jsonify({"error": f"Failed to connect AIDR: {str(e)}"}), 500


@app.route("/api/settings", methods=["GET"])
def get_settings():
    """Get current session settings."""
    return jsonify({
        "provider": session.get("provider", "openai"),
        "model": session.get("model", "gpt-4o-mini"),
        "persona": session.get("persona", "customer_support"),
        "ollama_url": session.get("ollama_url", "http://localhost:11434"),
        "has_api_key": bool(session.get("api_key", "")),
    })


@app.route("/api/settings", methods=["POST"])
def save_settings():
    """Save settings to session."""
    data = request.json
    if "provider" in data:
        session["provider"] = data["provider"]
    if "model" in data:
        session["model"] = data["model"]
    if "persona" in data:
        session["persona"] = data["persona"]
    if "api_key" in data and data["api_key"].strip():
        session["api_key"] = data["api_key"].strip()
    if "ollama_url" in data:
        session["ollama_url"] = data["ollama_url"]

    return jsonify({"status": "ok"})


@app.route("/api/models", methods=["GET"])
def get_models():
    """Get available models for the selected provider."""
    provider = request.args.get("provider", session.get("provider", "openai"))

    if provider == "ollama":
        ollama_url = request.args.get("ollama_url", "").strip()
        if ollama_url:
            session["ollama_url"] = ollama_url
        else:
            ollama_url = session.get("ollama_url", "http://localhost:11434")
        try:
            import requests as req
            resp = req.get(f"{ollama_url.rstrip('/')}/api/tags", timeout=5)
            resp.raise_for_status()
            data = resp.json()
            models = [m["name"] for m in data.get("models", [])]
            return jsonify({"models": models})
        except Exception as e:
            return jsonify({"models": [], "error": str(e)})
    else:
        return jsonify({"models": DEFAULT_MODELS.get(provider, [])})


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Main chat endpoint.
    Flow: User message → AIDR input guard → LLM → AIDR output guard → response
    """
    import base64
    
    aidr_enabled = True
    chat_id = None
    
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        aidr_enabled_str = request.form.get("aidr_enabled", "true")
        aidr_enabled = aidr_enabled_str.lower() == "true"
        user_message = request.form.get("message", "").strip()
        chat_id = request.form.get("chat_id", "").strip() or None
        uploaded_file = request.files.get("file")
        if uploaded_file:
            try:
                decoded_text = uploaded_file.read().decode("utf-8", errors="replace")
                file_name = uploaded_file.filename
                if not user_message:
                    user_message = f"Please analyze the attached file '{file_name}':\n\n--- Attachment: {file_name} ---\n{decoded_text}\n--- End Attachment ---"
                else:
                    user_message += f"\n\n--- Attachment: {file_name} ---\n{decoded_text}\n--- End Attachment ---"
            except Exception as e:
                print(f"Error reading multipart file: {e}")
                return jsonify({"error": "Failed to read uploaded file."}), 400
    else:
        data = request.get_json(silent=True) or {}
        aidr_enabled_str = str(data.get("aidr_enabled", "true"))
        aidr_enabled = aidr_enabled_str.lower() == "true"
        user_message = data.get("message", "").strip()
        chat_id = data.get("chat_id") or None
        file_data = data.get("file")

        if file_data:
            try:
                # content is like "data:text/plain;base64,U29tZSB0ZXh0"
                if "," in file_data.get("content", ""):
                    b64_str = file_data["content"].split(",")[1]
                else:
                    b64_str = file_data["content"]
                    
                decoded_bytes = base64.b64decode(b64_str)
                decoded_text = decoded_bytes.decode("utf-8", errors="replace")
                file_name = file_data.get("name", "uploaded_file")
                
                if not user_message:
                    user_message = f"Please analyze the attached file '{file_name}':\n\n--- Attachment: {file_name} ---\n{decoded_text}\n--- End Attachment ---"
                else:
                    user_message += f"\n\n--- Attachment: {file_name} ---\n{decoded_text}\n--- End Attachment ---"
            except Exception as e:
                print(f"Error parsing file: {e}")
                return jsonify({"error": "Failed to parse uploaded file. Right now, only text-based files (txt, csv, json, md, etc.) are supported."}), 400

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    # Get settings
    provider = session.get("provider", "openai")
    api_key = session.get("api_key", "")
    model = session.get("model", "gpt-4o-mini")
    persona_key = session.get("persona", "customer_support")
    ollama_url = session.get("ollama_url", "http://localhost:11434")

    # Validate API key (not needed for Ollama)
    if provider != "ollama" and not api_key:
        return jsonify({
            "error": f"No API key configured for {provider}. Please open Settings and add your API key.",
            "needs_setup": True,
        }), 400

    # Resolve the chat session
    if not chat_id or chat_id not in chat_sessions:
        # Auto-create a session if none provided
        chat_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        chat_sessions[chat_id] = {
            "id": chat_id,
            "user_id": session.get("session_id"), # IDOR fix: associate chat with user
            "title": "New Chat",
            "messages": [],
            "persona": persona_key,
            "aidr_triggered": False,
            "aidr_block_count": 0,
            "created_at": now,
            "updated_at": now,
        }

    chat_session = chat_sessions[chat_id]

    # IDOR fix: ensure user owns the chat they are trying to append to
    if chat_session.get("user_id") != session.get("session_id"):
        return jsonify({"error": "Chat not found"}), 404

    history = chat_session["messages"]

    # Build messages with persona system prompt
    persona = PERSONAS.get(persona_key, PERSONAS["customer_support"])
    messages = [{"role": "system", "content": persona["system_prompt"]}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # --- AIDR Input Guard ---
    input_blocked = False
    input_details = None
    if aidr_enabled:
        input_blocked, input_details = aidr_guard(
            [{"role": "user", "content": user_message}],
            event_type="input",
        )

        if input_blocked:
            # Track the AIDR block on the session
            chat_session["aidr_triggered"] = True
            chat_session["aidr_block_count"] = chat_session.get("aidr_block_count", 0) + 1
            chat_session["updated_at"] = datetime.now(timezone.utc).isoformat()
            # Auto-title from first message if still default
            if chat_session["title"] == "New Chat" and user_message:
                chat_session["title"] = user_message[:50] + ("…" if len(user_message) > 50 else "")
            _save_chat_sessions()
            return jsonify({
                "response": None,
                "blocked": True,
                "block_type": "input",
                "aidr": input_details,
                "chat_id": chat_id,
                "aidr_triggered": True,
                "message": "⚠️ Your message was blocked by CrowdStrike AIDR security. The input was flagged as potentially harmful.",
            })

    # --- Call LLM ---
    try:
        settings = {
            "provider": provider,
            "api_key": api_key,
            "model": model,
            "ollama_url": ollama_url,
        }
        ai_response = call_llm(messages, settings)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"LLM error: {str(e)}"}), 500

    # --- AIDR Output Guard ---
    output_blocked = False
    output_details = None
    if aidr_enabled:
        output_blocked, output_details = aidr_guard(
            [{"role": "assistant", "content": ai_response}],
            event_type="output",
        )

        if output_blocked:
            # Still save user message to history
            history.append({"role": "user", "content": user_message})
            # Track the AIDR block
            chat_session["aidr_triggered"] = True
            chat_session["aidr_block_count"] = chat_session.get("aidr_block_count", 0) + 1
            chat_session["updated_at"] = datetime.now(timezone.utc).isoformat()
            if chat_session["title"] == "New Chat" and user_message:
                chat_session["title"] = user_message[:50] + ("…" if len(user_message) > 50 else "")
            _save_chat_sessions()
            return jsonify({
                "response": None,
                "blocked": True,
                "block_type": "output",
                "aidr": output_details,
                "chat_id": chat_id,
                "aidr_triggered": True,
                "message": "⚠️ The AI response was blocked by CrowdStrike AIDR security. The output was flagged as potentially harmful.",
            })

    # --- Success ---
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": ai_response})

    # Auto-title from first user message
    if chat_session["title"] == "New Chat" and user_message:
        chat_session["title"] = user_message[:50] + ("…" if len(user_message) > 50 else "")

    chat_session["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Keep history manageable (last 20 turns)
    if len(history) > 40:
        chat_session["messages"] = history[-40:]

    _save_chat_sessions()

    return jsonify({
        "response": ai_response,
        "blocked": False,
        "chat_id": chat_id,
        "chat_title": chat_session["title"],
        "aidr_triggered": chat_session.get("aidr_triggered", False),
        "aidr_input": input_details,
        "aidr_output": output_details,
    })


@app.route("/api/clear", methods=["POST"])
def clear_chat():
    """Clear the active chat's messages (keeps the session in history)."""
    chat_id = session.get("active_chat_id", "")
    s = chat_sessions.get(chat_id)
    if s and s.get("user_id") == session.get("session_id"):
        s["messages"] = []
        _save_chat_sessions()
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n🤖 AIDR Chatbot starting...")
    print(f"🛡️  AIDR Protection: {'ENABLED' if aidr_client else 'DISABLED'}")
    print(f"🌐 http://localhost:5000\n")
    app.run(debug=True, port=5000)
