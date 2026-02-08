import React from 'react';

export default function Toast({ message, type, onClose }) {
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span className="toast-icon">
        {type === 'success' ? '\u2705' : type === 'error' ? '\u274C' : '\u2139\uFE0F'}
      </span>
      <span>{message}</span>
    </div>
  );
}
