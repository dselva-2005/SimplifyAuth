# WhatsApp-First Authentication Boilerplate (Python & React)

A production-ready, frictionless WhatsApp OTP authentication boilerplate built for hackathons and rapid prototyping. Powered by **Python (Flask)**, **React (Vite)**, and **[Minimoth](https://minimoth.dev)**.

---

## Features

- **WhatsApp-First Login**: Instant OTP delivery directly to user WhatsApp without SMS carrier latency or DND delivery drops.
- **Python Backend**: Clean, lightweight Flask backend (`server.py` & `minimoth.py`) integrating Minimoth OTP dispatch and verification endpoints.
- **Modern React Components**: Modular frontend with Vite, Lucide icons, responsive dark-mode aesthetic, and fluid states:
  1. **Phone Input Screen**: Country code prefix, clean number input, and instant validation.
  2. **OTP Verification Screen**: 6-digit individual passcode inputs with auto-advance, backspace handling, paste support, and a 30s resend cooldown timer.
  3. **Authenticated Dashboard**: Shows verified phone number, Session ID, and copyable JWT tokens (`accessToken`, `refreshToken`) with properly proportioned controls.
- **Refined Aesthetics**: Deep dark slate glassmorphism, glowing emerald WhatsApp accents, micro-animations, loading spinners, and toast notifications.
- **Zero-Friction Dev Setup**: Run both the Python API and Vite React frontend concurrently with `npm run dev`.

---

## Project Structure

```text
minimoth/
├── .env.example              # Example environment variables
├── .env                      # Local environment variables (API Key & Port)
├── server.py                 # Python Flask backend server
├── minimoth.py               # Minimoth Python client (send & verify OTP)
├── requirements.txt          # Python dependencies
├── package.json              # Project scripts and React dependencies
├── vite.config.mjs           # Vite config with React plugin & API proxy
├── index.html                # Vite React HTML entry
├── src/
│   ├── main.jsx              # React mounting root
│   ├── App.jsx               # Application controller & state machine
│   ├── index.css             # Refined CSS design tokens & animations
│   └── components/
│       ├── Header.jsx        # Branding badge, logo & setup alerts
│       ├── LoginScreen.jsx   # Phone input & send OTP flow
│       ├── VerifyScreen.jsx  # 6-digit OTP boxes, timer & auto-advance
│       ├── DashboardScreen.jsx # Verified session info, token copying & sign out
│       └── Toast.jsx         # Smooth sliding toast alerts
└── README.md                 # Setup instructions & documentation
```

---

## Quickstart Guide

### 1. Prerequisites
- **Python** 3.9+ installed.
- **Node.js** 18+ installed.
- A **Minimoth** account & API key (Get one from [Minimoth Dashboard](https://minimoth.dev)).

### 2. Install Dependencies

**Python Dependencies:**
```bash
pip install -r requirements.txt
```

**Frontend Dependencies:**
```bash
npm install
```

### 3. Configure Your Environment Variables
Ensure `.env` contains your Minimoth API key:
```env
MINIMOTH_API_KEY=mm_live_xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

### 4. Start the Application

**Development Mode (Concurrent Python API + Vite React hot-reloading):**
```bash
npm run dev
```

**Production Mode:**
```bash
# 1. Build the React frontend:
npm run build

# 2. Run the Python backend:
python server.py
```

Visit **[http://localhost:3000](http://localhost:3000)** (or `http://localhost:5173` during `npm run dev`) in your browser.

---

## API Reference

### 1. Send OTP
- **Endpoint**: `POST /api/send-otp`
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "OTP sent successfully via WhatsApp",
    "otpId": "otp_abc123",
    "expiresAt": "2026-10-07T08:50:00.000Z"
  }
  ```

### 2. Verify OTP
- **Endpoint**: `POST /api/verify-otp`
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210",
    "otp": "123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "sessionId": "sess_xyz789",
    "identityId": "id_123",
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```
# SimplifyAuth
# SimplifyAuth
# SimplifyAuth
# SimplifyAuth
# SimplifyAuth
