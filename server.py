"""
Flask Backend Server for WhatsApp-First Authentication Boilerplate
Powered by Minimoth
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from minimoth import MiniMoth, MiniMothError

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder=None)
CORS(app)

PORT = int(os.getenv("PORT", 3000))
DIST_DIR = Path(__file__).parent / "dist"
PUBLIC_DIR = Path(__file__).parent / "public"


def get_minimoth_client():
    api_key = os.getenv("MINIMOTH_API_KEY")
    if not api_key or api_key == "your_api_key_here" or not api_key.strip():
        raise MiniMothError(
            "MISSING_API_KEY",
            "MINIMOTH_API_KEY is not configured. Please set your API key in the .env file.",
            500,
        )
    return MiniMoth(api_key.strip())


@app.route("/api/config-check", methods=["GET"])
def config_check():
    api_key = os.getenv("MINIMOTH_API_KEY")
    is_configured = bool(api_key and api_key != "your_api_key_here" and api_key.strip())
    return jsonify({
        "configured": is_configured,
        "message": "Minimoth API key is set." if is_configured else "Minimoth API key is missing. Add MINIMOTH_API_KEY to your .env file."
    })


@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    try:
        body = request.get_json(silent=True) or {}
        phone = body.get("phoneNumber") or body.get("phone")

        if not phone or not str(phone).strip():
            return jsonify({
                "success": False,
                "message": "Phone number is required. Please provide a valid phone number with country code."
            }), 400

        client = get_minimoth_client()
        result = client.send_otp(str(phone).strip())

        return jsonify({
            "success": True,
            "message": "OTP sent successfully via WhatsApp",
            "otpId": result.get("otpId"),
            "expiresAt": result.get("expiresAt"),
        }), 200

    except MiniMothError as e:
        return jsonify({
            "success": False,
            "message": e.message,
            "code": e.code,
        }), e.status_code or 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    try:
        body = request.get_json(silent=True) or {}
        phone = body.get("phoneNumber") or body.get("phone")
        otp = body.get("otp")

        if not phone or not str(phone).strip():
            return jsonify({
                "success": False,
                "message": "Phone number is required."
            }), 400

        if not otp or not str(otp).strip():
            return jsonify({
                "success": False,
                "message": "OTP is required."
            }), 400

        client = get_minimoth_client()
        result = client.verify_otp(str(phone).strip(), str(otp).strip())

        return jsonify({
            "success": True,
            "message": "Authentication successful",
            "sessionId": result.get("sessionId"),
            "identityId": result.get("identityId"),
            "tokens": result.get("tokens", {}),
        }), 200

    except MiniMothError as e:
        return jsonify({
            "success": False,
            "message": e.message,
            "code": e.code,
        }), e.status_code or 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# Static Frontend & SPA Fallback Serving
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    # Route frontend files from dist/ (React build) or public/ (Vanilla fallback)
    target_dir = DIST_DIR if DIST_DIR.exists() else PUBLIC_DIR

    if path and (target_dir / path).exists():
        return send_from_directory(target_dir, path)

    if (target_dir / "index.html").exists():
        return send_from_directory(target_dir, "index.html")

    return jsonify({"message": "WhatsApp Auth API is running. Build frontend with 'npm run build'."}), 200


if __name__ == "__main__":
    print("=" * 50)
    print(" WhatsApp Auth Boilerplate (Python / Flask)")
    print(f" Local URL : http://localhost:{PORT}")
    print(" API Routes: POST /api/send-otp")
    print("             POST /api/verify-otp")
    print("=" * 50)
    app.run(host="0.0.0.0", port=PORT, debug=False)
