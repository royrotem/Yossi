import React from 'react';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u26A0\uFE0F'}</div>
        <h2 style={{ marginBottom: 16 }}>{message}</h2>
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button className="btn btn-danger" onClick={onConfirm}>מחק</button>
          <button className="btn" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
