import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_HEB = { pending: 'ממתין', in_progress: 'בביצוע', completed: 'הושלם', overdue: 'באיחור' };

export default function Milestones({ milestones, departments, onRefresh }) {
  const [quarter, setQuarter] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    department_id: '', title: '', due_date: '', year: 2026, quarter: 1
  });

  const deptMap = {};
  departments.forEach(d => { deptMap[d.id] = d; });

  const filtered = quarter === 0 ? milestones : milestones.filter(m => m.quarter === quarter);
  const sorted = [...filtered].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  const handleCreate = async () => {
    if (!form.title || !form.department_id) return;
    await axios.post(`${API}/api/milestones`, {
      ...form,
      department_id: Number(form.department_id),
      due_date: form.due_date || null,
    });
    setShowForm(false);
    setForm({ department_id: '', title: '', due_date: '', year: 2026, quarter: 1 });
    onRefresh();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${API}/api/milestones/${id}`, { status });
    onRefresh();
  };

  const deleteMilestone = async (id) => {
    await axios.delete(`${API}/api/milestones/${id}`);
    onRefresh();
  };

  return (
    <div>
      <div className="page-header">
        <h1>אבני דרך 2026</h1>
        <p>מעקב אחר אבני דרך מרכזיות לכל רבעון</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="quarter-tabs">
          <button className={`quarter-tab ${quarter === 0 ? 'active' : ''}`} onClick={() => setQuarter(0)}>הכל</button>
          {[1, 2, 3, 4].map(q => (
            <button key={q} className={`quarter-tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>Q{q}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ אבן דרך חדשה</button>
      </div>

      <div className="chart-card">
        <div className="timeline">
          {sorted.length === 0 ? (
            <div className="empty-state"><p>אין אבני דרך להצגה</p></div>
          ) : sorted.map((m, i) => {
            const dept = deptMap[m.department_id];
            return (
              <div key={m.id} className="timeline-item">
                <div>
                  <div className={`timeline-dot ${m.status}`} />
                  {i < sorted.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4>{m.title}</h4>
                      <div className="timeline-dept" style={{ color: dept?.color }}>
                        {dept?.name || '-'}
                      </div>
                      <div className="timeline-date">{m.due_date || 'ללא תאריך'} | Q{m.quarter}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge badge-${m.status}`}>{STATUS_HEB[m.status]}</span>
                      {m.status !== 'completed' && (
                        <button className="btn" style={{ padding: '4px 8px', fontSize: 11 }}
                          onClick={() => updateStatus(m.id, m.status === 'pending' ? 'in_progress' : 'completed')}>
                          {m.status === 'pending' ? 'התחל' : 'השלם'}
                        </button>
                      )}
                      <button className="btn" style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                        onClick={() => deleteMilestone(m.id)}>
                        {'\u2716'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>אבן דרך חדשה</h2>
            <div className="form-group">
              <label>כותרת</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>אגף</label>
              <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">בחר אגף...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>תאריך יעד</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>רבעון</label>
                <select value={form.quarter} onChange={e => setForm({...form, quarter: Number(e.target.value)})}>
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCreate}>צור אבן דרך</button>
              <button className="btn" onClick={() => setShowForm(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
