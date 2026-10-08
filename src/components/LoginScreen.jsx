import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LoginScreen({ onOtpSent, onError }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanAndFormatPhone = (rawInput) => {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = phone.trim();
    if (!raw) {
      onError('Please enter your phone number to proceed.');
      return;
    }

    const formattedPhone = cleanAndFormatPhone(raw);
    setLoading(true);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onOtpSent(formattedPhone);
      } else {
        onError(data.message || 'Failed to send OTP. Please check your number.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      onError('Connection error. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen-state">
      <div className="card-intro">
        <h2 className="card-title">Sign in with WhatsApp</h2>
        <p className="card-desc">
          Enter your phone number to receive a secure 6-digit one-time passcode on WhatsApp.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="phoneNumberInput" className="form-label">Phone Number</label>
          <div className="phone-input-wrapper">
            <div className="country-prefix">
              <span className="flag-icon">&#127470;&#127475;</span>
              <span className="prefix-code">+91</span>
            </div>
            <input
              type="tel"
              id="phoneNumberInput"
              className="form-input phone-field"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
            />
          </div>
          <p className="input-hint">Tip: Enter with country code or 10-digit mobile number for India.</p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" aria-hidden="true"></span>
              <span>Sending OTP...</span>
            </>
          ) : (
            <>
              <span>Send OTP via WhatsApp</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="feature-pills">
        <div className="pill">
          <CheckCircle2 size={14} />
          <span>No SMS Carrier Delay</span>
        </div>
        <div className="pill">
          <ShieldCheck size={14} />
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </section>
  );
}
