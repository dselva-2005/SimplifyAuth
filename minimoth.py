"""
Minimoth Python Client
Official API integration for WhatsApp-first OTP authentication.
"""

import os
import re
import requests
import jwt

BASE_URL = "https://api.minimoth.dev"
USER_AGENT = "minimoth-sdk-python/0.4.0"


class MiniMothError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def normalize_phone(raw: str) -> str:
    """Normalize phone number to international format."""
    if not raw or not isinstance(raw, str):
        raise MiniMothError("INVALID_PHONE", "Phone number is required", 422)

    cleaned = re.sub(r"[\s-]", "", raw)
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]

    # If exactly 10 digits without country code, default to India (+91)
    if re.match(r"^\d{10}$", cleaned):
        return "91" + cleaned

    return cleaned


class MiniMoth:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("MINIMOTH_API_KEY")
        if not self.api_key or self.api_key == "your_api_key_here":
            raise MiniMothError(
                "MISSING_API_KEY",
                "MINIMOTH_API_KEY is not configured in environment.",
                500
            )

    def _headers(self):
        return {
            "Content-Type": "application/json",
            "X-Api-Key": self.api_key,
            "User-Agent": USER_AGENT,
        }

    def send_otp(self, phone: str) -> dict:
        """
        Sends an OTP to the given phone number via WhatsApp.
        Returns: { 'otp_id': str, 'expires_at': str }
        """
        normalized = normalize_phone(phone)
        url = f"{BASE_URL}/v1/otp/send"
        payload = {"phone": normalized}

        try:
            resp = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        except requests.RequestException as e:
            raise MiniMothError("NETWORK_ERROR", f"Network error: {str(e)}", 0)

        data = resp.json() if resp.content else {}
        if not resp.ok:
            code = data.get("code", "UNKNOWN_ERROR")
            msg = data.get("error") or data.get("message") or "Failed to send OTP"
            raise MiniMothError(code, msg, resp.status_code)

        return {
            "otpId": data.get("otp_id"),
            "expiresAt": data.get("expires_at"),
        }

    def verify_otp(self, phone: str, otp: str) -> dict:
        """
        Verifies the WhatsApp OTP.
        Returns: {
            'valid': bool,
            'tokens': { 'accessToken': str, 'refreshToken': str },
            'sessionId': str,
            'identityId': str
        }
        """
        if not otp or not isinstance(otp, str):
            raise MiniMothError("INVALID_OTP", "OTP is required", 422)

        normalized = normalize_phone(phone)
        url = f"{BASE_URL}/v1/otp/verify"
        payload = {"phone": normalized, "code": otp.strip()}

        try:
            resp = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        except requests.RequestException as e:
            raise MiniMothError("NETWORK_ERROR", f"Network error: {str(e)}", 0)

        data = resp.json() if resp.content else {}
        if not resp.ok:
            code = data.get("code", "UNKNOWN_ERROR")
            msg = data.get("error") or data.get("message") or "Verification failed"
            raise MiniMothError(code, msg, resp.status_code)

        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")

        # Decode unverified JWT payload to extract session_id and identity_id
        session_id = None
        identity_id = None
        if access_token:
            try:
                decoded = jwt.decode(access_token, options={"verify_signature": False})
                session_id = decoded.get("session_id")
                identity_id = decoded.get("identity_id")
            except Exception:
                pass

        return {
            "valid": True,
            "sessionId": session_id or "active_session",
            "identityId": identity_id,
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
            },
        }
