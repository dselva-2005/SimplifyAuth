import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import VerifyScreen from './components/VerifyScreen';
import DashboardScreen from './components/DashboardScreen';
import Toast from './components/Toast';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'verify' | 'dashboard'
  const [phone, setPhone] = useState('');
  const [authData, setAuthData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isConfigured, setIsConfigured] = useState(true);

  // Check backend configuration on load
  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch('/api/config-check');
        const data = await res.json();
        setIsConfigured(Boolean(data.configured));
      } catch {
        // Fallback
      }
    }
    checkConfig();
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const handleOtpSent = (submittedPhone) => {
    setPhone(submittedPhone);
    showToast('OTP sent successfully to your WhatsApp!', 'success');
    setScreen('verify');
  };

  const handleVerified = (responseAuthData) => {
    setAuthData(responseAuthData);
    showToast('Authentication successful!', 'success');
    setScreen('dashboard');
  };

  const handleLogout = () => {
    setPhone('');
    setAuthData(null);
    showToast('Signed out successfully.', 'success');
    setScreen('login');
  };

  return (
    <>
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="auth-container">
        <Header isConfigured={isConfigured} />

        <div className="auth-card">
          {screen === 'login' && (
            <LoginScreen
              onOtpSent={handleOtpSent}
              onError={(msg) => showToast(msg, 'error')}
            />
          )}

          {screen === 'verify' && (
            <VerifyScreen
              phone={phone}
              onVerified={handleVerified}
              onBack={() => setScreen('login')}
              onError={(msg) => showToast(msg, 'error')}
              onSuccessToast={(msg) => showToast(msg, 'success')}
            />
          )}

          {screen === 'dashboard' && (
            <DashboardScreen
              phone={phone}
              authData={authData}
              onLogout={handleLogout}
              onSuccessToast={(msg) => showToast(msg, 'success')}
            />
          )}
        </div>

        <footer className="auth-card-footer">
          <p>
            Built for Hackathons with{' '}
            <a href="https://minimoth.dev" target="_blank" rel="noopener noreferrer">
              Minimoth
            </a>{' '}
            &amp; React
          </p>
        </footer>
      </main>
    </>
  );
}
