import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Header({ isConfigured }) {
  return (
    <>
      <header className="auth-header">
        <div className="brand-badge">
          <div className="whatsapp-icon-wrapper">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.301-.15-1.783-.88-2.06-.98-.278-.1-.48-.15-.682.15-.202.302-.782.98-.958 1.182-.177.202-.353.226-.654.076-.302-.15-1.275-.47-2.428-1.498-.897-.8-1.503-1.789-1.68-2.091-.177-.302-.019-.465.132-.615.136-.135.302-.352.453-.528.151-.176.202-.302.302-.503.101-.202.05-.378-.025-.528-.075-.151-.682-1.644-.934-2.253-.245-.593-.495-.512-.682-.522l-.582-.01c-.201 0-.528.076-.804.377-.277.302-1.057 1.033-1.057 2.52 0 1.486 1.082 2.923 1.233 3.124.151.202 2.13 3.253 5.16 4.561.721.312 1.284.498 1.723.638.724.23 1.383.197 1.904.12.58-.087 1.783-.728 2.034-1.431.252-.703.252-1.306.176-1.432-.075-.125-.276-.201-.578-.351zM12.05 2C6.54 2 2.08 6.46 2.08 11.97c0 1.9.53 3.68 1.45 5.21L2 22l4.98-1.49c1.48.83 3.19 1.31 5.07 1.31 5.51 0 9.97-4.46 9.97-9.97C22.02 6.46 17.56 2 12.05 2zm0 18.25c-1.65 0-3.18-.46-4.5-1.26l-.32-.19-2.96.89.89-2.88-.21-.34c-.87-1.37-1.37-2.99-1.37-4.72 0-4.67 3.8-8.47 8.47-8.47 4.67 0 8.47 3.8 8.47 8.47 0 4.67-3.8 8.47-8.47 8.47z"/>
            </svg>
          </div>
          <span className="badge-text">WhatsApp Authentication</span>
          <span className="pulse-dot" title="Live Ready"></span>
        </div>
        <h1 className="brand-title">Minimoth Auth</h1>
        <p className="brand-tagline">Fast, frictionless OTP verification delivered straight to WhatsApp</p>
      </header>

      {!isConfigured && (
        <div className="api-key-banner">
          <div className="banner-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="banner-text">
            <strong>Setup Required:</strong> Please configure <code>MINIMOTH_API_KEY</code> in your <code>.env</code> file to enable live OTP delivery.
          </div>
        </div>
      )}
    </>
  );
}
