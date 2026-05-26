#!/usr/bin/env python3
"""
SPDX-License-Identifier: Apache-2.0
"""

import os
import time
import json
import urllib.request
import logging
from flask import Flask, request, jsonify, render_template
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=".env.local")
load_dotenv(dotenv_path=".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LASTRI-Flask-Backend")

# Configure global proxy if defined in environment
proxy_url = os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY") or os.environ.get("http_proxy") or os.environ.get("https_proxy")
if proxy_url:
    logger.info(f"Configuring global proxy: {proxy_url}")
    proxy_support = urllib.request.ProxyHandler({
        'http': proxy_url,
        'https': proxy_url
    })
    opener = urllib.request.build_opener(proxy_support)
    urllib.request.install_opener(opener)

app = Flask(__name__, static_folder="static", template_folder="templates")

ai_client = None

def get_gemini_client() -> genai.Client:
    global ai_client
    if ai_client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("⚠️ GEMINI_API_KEY environment variable is not defined. AI Chat will run in mock descriptive mode.")
            api_key = "MOCK_KEY"
        
        ai_client = genai.Client(
            api_key=api_key,
            http_options={"headers": {"User-Agent": "aistudio-build"}}
        )
    return ai_client

@app.route("/")
def index():
    return render_template("index.html")

# Keep support for direct routing / spa routing
@app.errorhandler(404)
def page_not_found(e):
    # If the user accesses an API path, return 404 JSON
    if request.path.startswith("/api"):
        return jsonify({"error": "Not Found"}), 404
    # For web browser requests, fallback to rendering templates/index.html (SPA client routing)
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json() or {}
        message = data.get("message")
        history = data.get("history")
        session_id = data.get("sessionId", "default-session")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        # Send request to n8n Webhook
        webhook_url = "https://n8n-a7i36gib7qhw.pisang.sumopod.my.id/webhook/lastri"
        # webhook_url = "https://n8n-a7i36gib7qhw.pisang.sumopod.my.id/webhook-test/lastri"
        
        payload = json.dumps({
            "message": message,
            "history": history,
            "sessionId": session_id
        }).encode("utf-8")
        
        req = urllib.request.Request(
            webhook_url, 
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = response.read().decode("utf-8")
                
                # Try to parse n8n response as JSON, fallback to raw text
                try:
                    n8n_json = json.loads(response_data)
                    # Try to get the text from typical locations if n8n returns a complex object
                    if isinstance(n8n_json, list) and len(n8n_json) > 0:
                        reply_text = n8n_json[0].get("text", response_data)
                    elif isinstance(n8n_json, dict):
                        reply_text = n8n_json.get("text", response_data)
                    else:
                        reply_text = str(n8n_json)
                except json.JSONDecodeError:
                    reply_text = response_data
                    
            return jsonify({"text": reply_text})
            
        except urllib.error.URLError as e:
            logger.error(f"n8n Webhook Error: {str(e)}")
            return jsonify({"error": "Failed to reach n8n workflow", "details": str(e)}), 502

    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e) or "Something went wrong in the assistant backend."
        }), 500

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "LASTRI-Virtual-Assistant-Flask"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    # Enable debugging during development
    app.run(host="0.0.0.0", port=port, debug=True)
