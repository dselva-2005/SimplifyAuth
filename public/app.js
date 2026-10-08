/**
 * WhatsApp-First Authentication Boilerplate
 * Vanilla JavaScript Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    phoneNumber: '',
    rawPhoneDisplay: '',
    resendInterval: null,
    resendSecondsRemaining: 30,
    tokens: null,
    sessionId: null
  };

  // Screen Elements
  const screenLogin = document.getElementById('screenLogin');
  const screenVerify = document.getElementById('screenVerify');
  const screenDashboard = document.getElementById('screenDashboard');
  const apiKeyBanner = document.getElementById('apiKeyBanner');

  // Login Form Elements
  const loginForm = document.getElementById('loginForm');
  const phoneInput = document.getElementById('phoneNumber');
  const btnSendOtp = document.getElementById('btnSendOtp');

  // Verify Form Elements
  const verifyForm = document.getElementById('verifyForm');
  const displayPhone = document.getElementById('displayPhone');
  const btnEditPhone = document.getElementById('btnEditPhone');
  const otpDigits = Array.from(document.querySelectorAll('.otp-digit'));
  const otpValue = document.getElementById('otpValue');
  const btnVerifyOtp = document.getElementById('btnVerifyOtp');
  const btnBackToLogin = document.getElementById('btnBackToLogin');
  const countdownText = document.getElementById('countdownText');
  const timerSecs = document.getElementById('timerSecs');
  const btnResend = document.getElementById('btnResend');

  // Dashboard Elements
  const dashPhone = document.getElementById('dashPhone');
  const dashSessionId = document.getElementById('dashSessionId');
  const dashAccessToken = document.getElementById('dashAccessToken');
  const btnCopyTokens = document.getElementById('btnCopyTokens');
  const btnLogout = document.getElementById('btnLogout');

  // Toast Elements
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastClose = document.getElementById('toastClose');
  let toastTimeout = null;

  // Initialize
  checkApiConfig();
  setupOtpInputHandlers();

  // ==========================================
  // SCREEN NAVIGATION
  // ==========================================
  function showScreen(screenName) {
    screenLogin.classList.add('hidden');
    screenVerify.classList.add('hidden');
    screenDashboard.classList.add('hidden');

    if (screenName === 'login') {
      screenLogin.classList.remove('hidden');
      clearInterval(state.resendInterval);
      phoneInput.focus();
    } else if (screenName === 'verify') {
      screenVerify.classList.remove('hidden');
      displayPhone.textContent = state.rawPhoneDisplay || state.phoneNumber;
      resetOtpInputs();
      startResendCountdown(30);
      otpDigits[0]?.focus();
    } else if (screenName === 'dashboard') {
      screenDashboard.classList.remove('hidden');
      clearInterval(state.resendInterval);
    }
  }

  // ==========================================
  // CONFIG CHECK
  // ==========================================
  async function checkApiConfig() {
    try {
      const res = await fetch('/api/config-check');
      const data = await res.json();
      if (!data.configured) {
        apiKeyBanner.classList.remove('hidden');
      } else {
        apiKeyBanner.classList.add('hidden');
      }
    } catch {
      // Ignore background check failure
    }
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'error') {
    clearTimeout(toastTimeout);
    toast.className = `toast toast-${type}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 5000);
  }

  toastClose.addEventListener('click', () => {
    toast.classList.add('hidden');
    clearTimeout(toastTimeout);
  });

  // ==========================================
  // BUTTON LOADING STATE
  // ==========================================
  function setButtonLoading(button, isLoading, originalText) {
    const textSpan = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    const icon = button.querySelector('.btn-icon');

    button.disabled = isLoading;

    if (isLoading) {
      if (spinner) spinner.classList.remove('hidden');
      if (icon) icon.classList.add('hidden');
    } else {
      if (spinner) spinner.classList.add('hidden');
      if (icon) icon.classList.remove('hidden');
      if (textSpan && originalText) textSpan.textContent = originalText;
    }
  }

  // ==========================================
  // PHONE NUMBER FORMATTING HELPER
  // ==========================================
  function cleanAndFormatPhone(rawInput) {
    const trimmed = rawInput.trim();
    // If it already starts with '+', keep country code intact
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    // If user entered 10 digits without country code, default to +91 (India)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    }
    // Otherwise prepend '+'
    return `+${digitsOnly}`;
  }

  // ==========================================
  // SCREEN 1: SEND OTP (LOGIN)
  // ==========================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const raw = phoneInput.value.trim();
    if (!raw) {
      showToast('Please enter your phone number to proceed.', 'error');
      phoneInput.focus();
      return;
    }

    const formattedPhone = cleanAndFormatPhone(raw);
    state.phoneNumber = formattedPhone;
    state.rawPhoneDisplay = formattedPhone;

    setButtonLoading(btnSendOtp, true);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('OTP sent successfully to your WhatsApp!', 'success');
        showScreen('verify');
      } else {
        const errorMsg = data.message || 'Failed to send OTP. Please try again.';
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      showToast('Connection failed. Make sure your local server is running.', 'error');
    } finally {
      setButtonLoading(btnSendOtp, false);
    }
  });

  // ==========================================
  // OTP INPUT UX (6 BOXES WITH AUTO-FOCUS & PASTE)
  // ==========================================
  function setupOtpInputHandlers() {
    otpDigits.forEach((digitInput, idx) => {
      // Handle input of numeric characters
      digitInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val[val.length - 1] : '';

        if (e.target.value) {
          e.target.classList.add('filled');
          if (idx < otpDigits.length - 1) {
            otpDigits[idx + 1].focus();
          }
        } else {
          e.target.classList.remove('filled');
        }

        updateConsolidatedOtp();

        // Auto-submit if all 6 digits are filled
        if (getConsolidatedOtp().length === 6) {
          verifyForm.requestSubmit();
        }
      });

      // Handle Backspace & Arrow keys navigation
      digitInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!digitInput.value && idx > 0) {
            otpDigits[idx - 1].focus();
            otpDigits[idx - 1].value = '';
            otpDigits[idx - 1].classList.remove('filled');
            updateConsolidatedOtp();
          } else {
            digitInput.value = '';
            digitInput.classList.remove('filled');
            updateConsolidatedOtp();
          }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          otpDigits[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < otpDigits.length - 1) {
          otpDigits[idx + 1].focus();
        }
      });

      // Handle Paste event on any of the boxes
      digitInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);

        if (digits) {
          digits.split('').forEach((char, i) => {
            if (otpDigits[i]) {
              otpDigits[i].value = char;
              otpDigits[i].classList.add('filled');
            }
          });
          const focusIndex = Math.min(digits.length, otpDigits.length - 1);
          otpDigits[focusIndex].focus();
          updateConsolidatedOtp();

          if (digits.length === 6) {
            verifyForm.requestSubmit();
          }
        }
      });
    });
  }

  function getConsolidatedOtp() {
    return otpDigits.map(input => input.value).join('');
  }

  function updateConsolidatedOtp() {
    otpValue.value = getConsolidatedOtp();
  }

  function resetOtpInputs() {
    otpDigits.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
    otpValue.value = '';
  }

  // ==========================================
  // RESEND COUNTDOWN TIMER
  // ==========================================
  function startResendCountdown(seconds = 30) {
    clearInterval(state.resendInterval);
    state.resendSecondsRemaining = seconds;

    countdownText.classList.remove('hidden');
    btnResend.classList.add('hidden');
    timerSecs.textContent = state.resendSecondsRemaining;

    state.resendInterval = setInterval(() => {
      state.resendSecondsRemaining -= 1;
      timerSecs.textContent = state.resendSecondsRemaining;

      if (state.resendSecondsRemaining <= 0) {
        clearInterval(state.resendInterval);
        countdownText.classList.add('hidden');
        btnResend.classList.remove('hidden');
      }
    }, 1000);
  }

  btnResend.addEventListener('click', async () => {
    btnResend.disabled = true;
    btnResend.textContent = 'Sending...';

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: state.phoneNumber })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('New OTP sent to your WhatsApp!', 'success');
        resetOtpInputs();
        otpDigits[0].focus();
        startResendCountdown(30);
      } else {
        showToast(data.message || 'Failed to resend OTP.', 'error');
      }
    } catch (err) {
      console.error('Resend error:', err);
      showToast('Failed to resend OTP. Check connection.', 'error');
    } finally {
      btnResend.disabled = false;
      btnResend.textContent = 'Resend via WhatsApp';
    }
  });

  // Edit Phone / Go Back Buttons
  btnEditPhone.addEventListener('click', () => showScreen('login'));
  btnBackToLogin.addEventListener('click', () => showScreen('login'));

  // ==========================================
  // SCREEN 2: VERIFY OTP
  // ==========================================
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = getConsolidatedOtp();
    if (!otp || otp.length < 6) {
      showToast('Please enter the complete 6-digit OTP.', 'error');
      const firstEmpty = otpDigits.find(d => !d.value) || otpDigits[0];
      firstEmpty.focus();
      return;
    }

    setButtonLoading(btnVerifyOtp, true);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: state.phoneNumber,
          otp: otp
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        state.tokens = data.tokens;
        state.sessionId = data.sessionId;

        // Populate Dashboard details
        dashPhone.textContent = state.phoneNumber;
        dashSessionId.textContent = data.sessionId || 'active_session';
        dashAccessToken.textContent = data.tokens?.accessToken || 'N/A';

        showToast('Login successful!', 'success');
        showScreen('dashboard');
      } else {
        const errorMsg = data.message || 'Invalid OTP code. Please check and try again.';
        showToast(errorMsg, 'error');
        resetOtpInputs();
        otpDigits[0].focus();
      }
    } catch (err) {
      console.error('Verify error:', err);
      showToast('Verification failed. Server connection error.', 'error');
    } finally {
      setButtonLoading(btnVerifyOtp, false);
    }
  });

  // ==========================================
  // SCREEN 3: DASHBOARD ACTIONS
  // ==========================================
  btnCopyTokens.addEventListener('click', async () => {
    if (!state.tokens) return;

    try {
      const payloadToCopy = JSON.stringify({
        sessionId: state.sessionId,
        accessToken: state.tokens.accessToken,
        refreshToken: state.tokens.refreshToken
      }, null, 2);

      await navigator.clipboard.writeText(payloadToCopy);

      const copyLabel = btnCopyTokens.querySelector('span');
      const orig = copyLabel.textContent;
      copyLabel.textContent = 'Copied!';
      btnCopyTokens.style.borderColor = 'var(--wa-green)';

      setTimeout(() => {
        copyLabel.textContent = orig;
        btnCopyTokens.style.borderColor = '';
      }, 2000);
    } catch {
      showToast('Failed to copy to clipboard.', 'error');
    }
  });

  btnLogout.addEventListener('click', () => {
    state.phoneNumber = '';
    state.rawPhoneDisplay = '';
    state.tokens = null;
    state.sessionId = null;
    phoneInput.value = '';
    resetOtpInputs();
    showToast('Signed out successfully.', 'success');
    showScreen('login');
  });
});
