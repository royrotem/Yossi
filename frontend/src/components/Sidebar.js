import React from 'react';

const navItems = [
  { id: 'dashboard', icon: '\u{1F4CA}', label: 'דשבורד' },
  { id: 'orgchart', icon: '\u{1F3E2}', label: 'מבנה ארגוני' },
  { id: 'goals', icon: '\u{1F3AF}', label: 'יעדים שנתיים' },
  { id: 'milestones', icon: '\u{1F6A9}', label: 'אבני דרך' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        מערכת גרף שנתי
        <small>ניהול אגפים | ארגון</small>
      </div>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
