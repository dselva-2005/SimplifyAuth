import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

export default function VerifyScreen({ phone, onVerified, onBack, onResend, onError, onSuccessToast }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  // Auto-focus first digit on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 30s Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned ? cleaned[cleaned.length - 1] : '';

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if 6 digits are complete
    if (char && newDigits.every((d) => d.length === 1)) {
      submitOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const numeric = pasted.replace(/\D/g, '').slice(0, 6);

    if (numeric) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < numeric.length; i++) {
        newDigits[i] = numeric[i];
      }
      setDigits(newDigits);

      const nextFocus = Math.min(numeric.length, 5);
      inputRefs.current[nextFocus]?.focus();

      if (numeric.length === 6) {
        submitOtp(numeric);
      }
    }
  };

  const submitOtp = async (otpCode) => {
    const code = otpCode || digits.join('');
    if (!code || code.length < 6) {
      onError('Please enter the full 6-digit verification code.');
      const firstEmpty = digits.findIndex((d) => !d);
      inputRefs.current[firstEmpty !== -1 ? firstEmpty : 0]?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          otp: code
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onVerified(data);
      } else {
        onError(data.message || 'Invalid OTP code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      onError('Verification failed. Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccessToast('New OTP sent to your WhatsApp!');
        setDigits(['', '', '', '', '', '']);
        setTimer(30);
        inputRefs.current[0]?.focus();
      } else {
        onError(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      onError('Failed to resend OTP. Check your server connection.');
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="screen-state">
      <div className="card-intro">
        <div className="state-icon-badge">
          <Lock size={20} />
        </div>
        <h2 className="card-title">Enter Verification Code</h2>
        <p className="card-desc">
          We sent a 6-digit WhatsApp OTP to<br />
          <strong className="highlighted-phone">{phone}</strong>
          <button type="button" className="btn-text-link" onClick={onBack}>
            Change
          </button>
        </p>
      </div>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          submitOtp();
        }}
        noValidate
      >
        <div className="form-group">
          <label className="form-label">One-Time Passcode</label>
          <div className="otp-inputs-wrapper" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                className={`otp-digit ${digit ? 'filled' : ''}`}
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" aria-hidden="true"></span>
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify &amp; Login</span>
          )}
        </button>
      </form>

      <div className="verify-footer">
        <div className="resend-block">
          {timer > 0 ? (
            <span>
              Resend code in <strong>{timer}s</strong>
            </span>
          ) : (
            <button
              type="button"
              className="btn-resend"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend via WhatsApp'}
            </button>
          )}
        </div>

        <button type="button" className="btn-back" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Phone Entry</span>
        </button>
      </div>
    </section>
  );
}
