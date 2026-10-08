import React, { useState } from 'react';
import { Check, Copy, CheckCheck, LogOut } from 'lucide-react';

export default function DashboardScreen({ phone, authData, onLogout, onSuccessToast }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const tokens = authData?.tokens || {};
  const sessionId = authData?.sessionId || 'sess_active';
  const accessToken = tokens.accessToken || '';
  const refreshToken = tokens.refreshToken || '';

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onSuccessToast(`Copied to clipboard!`);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const copyFullSession = () => {
    const sessionPayload = JSON.stringify({
      phone,
      sessionId,
      identityId: authData?.identityId,
      tokens
    }, null, 2);
    copyToClipboard(sessionPayload, 'full');
  };

  return (
    <section className="screen-state">
      <div className="success-banner">
        <div className="success-checkmark-circle">
          <Check size={28} strokeWidth={3} />
        </div>
        <h2 className="card-title">Welcome!</h2>
        <p className="success-subtitle">Authentication Successful &amp; Session Created</p>
      </div>

      <div className="session-details-card">
        <div className="session-header">
          <span className="session-badge">Active Session</span>
          <span className="session-provider">WhatsApp (Minimoth)</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Verified Number</span>
          <span className="detail-value">{phone}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Session ID</span>
          <span className="detail-value font-mono">
            {sessionId.length > 20 ? `${sessionId.slice(0, 16)}...` : sessionId}
          </span>
        </div>

        <div className="detail-row tokens-row">
          <div className="tokens-header">
            <span className="detail-label">Access Token (JWT)</span>
            <button
              type="button"
              className="btn-copy"
              onClick={() => copyToClipboard(accessToken, 'access')}
              title="Copy access token"
            >
              {copiedKey === 'access' ? (
                <>
                  <CheckCheck size={12} color="#25D366" />
                  <span style={{ color: '#25D366' }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="token-preview">{accessToken || 'No access token available'}</pre>
        </div>

        {refreshToken && (
          <div className="detail-row tokens-row">
            <div className="tokens-header">
              <span className="detail-label">Refresh Token</span>
              <button
                type="button"
                className="btn-copy"
                onClick={() => copyToClipboard(refreshToken, 'refresh')}
                title="Copy refresh token"
              >
                {copiedKey === 'refresh' ? (
                  <>
                    <CheckCheck size={12} color="#25D366" />
                    <span style={{ color: '#25D366' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="token-preview">{refreshToken}</pre>
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={onLogout}
        >
          <LogOut size={16} />
          <span>Sign Out &amp; Return to Login</span>
        </button>
      </div>
    </section>
  );
}
