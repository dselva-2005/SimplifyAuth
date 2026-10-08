require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MiniMoth, MiniMothError } = require('@minimoth/sdk-node');

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets (dist if built, otherwise public)
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

/**
 * Helper to get or validate the Minimoth client instance.
 * Re-reads process.env.MINIMOTH_API_KEY so changes in .env are picked up.
 */
function getMinimothClient() {
  const apiKey = process.env.MINIMOTH_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    throw new Error('MINIMOTH_API_KEY is not configured. Please set your API key in the .env file.');
  }
  return new MiniMoth({ apiKey: apiKey.trim() });
}

/**
 * Diagnostic endpoint to check configuration status
 */
app.get('/api/config-check', (req, res) => {
  const apiKey = process.env.MINIMOTH_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey !== 'your_api_key_here' && apiKey.trim().length > 0);
  res.json({
    configured: isConfigured,
    message: isConfigured
      ? 'Minimoth API key is set.'
      : 'Minimoth API key is missing. Add MINIMOTH_API_KEY to your .env file.'
  });
});

/**
 * POST /api/send-otp
 * Accepts: { phoneNumber: string }
 * Sends a WhatsApp OTP to the given phone number via Minimoth SDK.
 */
app.post('/api/send-otp', async (req, res) => {
  try {
    const rawPhone = req.body.phoneNumber || req.body.phone;

    if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required. Please provide a valid phone number with country code.'
      });
    }

    const client = getMinimothClient();
    const result = await client.otp.send({ phone: rawPhone.trim() });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully via WhatsApp',
      otpId: result.otpId,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Error in /api/send-otp:', error);

    if (error instanceof MiniMothError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to send OTP via WhatsApp',
        code: error.code
      });
    }

    const isApiKeyError = error.message && error.message.includes('MINIMOTH_API_KEY');
    return res.status(isApiKeyError ? 500 : 400).json({
      success: false,
      message: error.message || 'An unexpected error occurred while sending OTP'
    });
  }
});

/**
 * POST /api/verify-otp
 * Accepts: { phoneNumber: string, otp: string }
 * Verifies the WhatsApp OTP and generates session tokens via Minimoth SDK.
 */
app.post('/api/verify-otp', async (req, res) => {
  try {
    const rawPhone = req.body.phoneNumber || req.body.phone;
    const otp = req.body.otp;

    if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.'
      });
    }

    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required.'
      });
    }

    const client = getMinimothClient();
    const result = await client.otp.verify({
      phone: rawPhone.trim(),
      otp: otp.trim()
    });

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        sessionId: result.sessionId,
        identityId: result.identityId || null,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        code: result.code,
        message: getReadableErrorMessage(result.code)
      });
    }
  } catch (error) {
    console.error('Error in /api/verify-otp:', error);

    if (error instanceof MiniMothError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: getReadableErrorMessage(error.code) || error.message,
        code: error.code
      });
    }

    const isApiKeyError = error.message && error.message.includes('MINIMOTH_API_KEY');
    return res.status(isApiKeyError ? 500 : 400).json({
      success: false,
      message: error.message || 'An unexpected error occurred during OTP verification'
    });
  }
});

/**
 * Helper to map MiniMoth error codes to user-friendly messages
 */
function getReadableErrorMessage(code) {
  switch (code) {
    case 'INVALID_OTP':
    case 'INVALID_OTP_CODE':
      return 'The OTP you entered is incorrect. Please check and try again.';
    case 'OTP_NOT_FOUND':
    case 'OTP_REQUEST_NOT_FOUND':
      return 'No active OTP request found or OTP has expired. Please request a new OTP.';
    case 'VERIFY_RATE_LIMITED':
    case 'OTP_RATE_LIMITED':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'INVALID_PHONE':
      return 'Invalid phone number format. Please include country code (e.g. +91 9876543210).';
    case 'INSUFFICIENT_BALANCE':
      return 'Insufficient Minimoth account credits. Please check your developer dashboard.';
    default:
      return code ? `Verification failed (${code})` : 'Verification failed. Please try again.';
  }
}

// Wildcard SPA route for React client
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` WhatsApp Auth Boilerplate running!`);
  console.log(` Local URL : http://localhost:${PORT}`);
  console.log(` API Routes: POST /api/send-otp`);
  console.log(`             POST /api/verify-otp`);
  console.log(`===============================================`);
});
