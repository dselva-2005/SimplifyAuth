import React from 'react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      className={`toast toast-${toast.type || 'error'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-message">{toast.message}</div>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}
