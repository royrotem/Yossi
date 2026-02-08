import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_MAP = { planned: 'מתוכנן', in_progress: 'בביצוע', completed: 'הושלם', cancelled: 'בוטל' };
const PRIORITY_MAP = { low: 'נמוך', medium: 'בינוני', high: 'גבוה', critical: 'קריטי' };

export default function Goals({ goals, departments, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    department_id: '', title: '', description: '', category: 'general',
    priority: 'medium', quarter: 0, year: 2026, kpi_target: 0, kpi_unit: ''
  });

  const deptMap = {};
  departments.forEach(d => { deptMap[d.id] = d.name; });

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);

  const handleCreate = async () => {
    if (!form.title || !form.department_id) return;
    await axios.post(`${API}/api/goals`, { ...form, department_id: Number(form.department_id) });
    setShowForm(false);
    setForm({ department_id: '', title: '', description: '', category: 'general', priority: 'medium', quarter: 0, year: 2026, kpi_target: 0, kpi_unit: '' });
    onRefresh();
  };

  const updateStatus = async (id, status) => {
    const progress = status === 'completed' ? 100 : undefined;
    await axios.put(`${API}/api/goals/${id}`, { status, ...(progress !== undefined ? { progress } : {}) });
    onRefresh();
  };

  const deleteGoal = async (id) => {
    await axios.delete(`${API}/api/goals/${id}`);
    onRefresh();
  };

  return (
    <div>
      <div className="page-header">
        <h1>יעדים שנתיים 2026</h1>
        <p>ניהול ומעקב אחר יעדים שנתיים של כל האגפים</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="quarter-tabs">
          {[['all', 'הכל'], ['planned', 'מתוכנן'], ['in_progress', 'בביצוע'], ['completed', 'הושלם']].map(([k, v]) => (
            <button key={k} className={`quarter-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ יעד חדש</button>
      </div>

      <div className="goals-section">
        <table className="goals-table">
          <thead>
            <tr>
              <th>יעד</th>
              <th>אגף</th>
              <th>עדיפות</th>
              <th>סטטוס</th>
              <th>התקדמות</th>
              <th>KPI</th>
              <th>רבעון</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#5a6a7a' }}>אין יעדים להצגה</td></tr>
            ) : filtered.map(g => (
              <tr key={g.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{g.title}</div>
                  {g.description && <div style={{ fontSize: 11, color: '#5a6a7a', marginTop: 2 }}>{g.description.substring(0, 60)}</div>}
                </td>
                <td style={{ fontSize: 12 }}>{deptMap[g.department_id] || '-'}</td>
                <td><span className={`badge badge-${g.priority}`}>{PRIORITY_MAP[g.priority]}</span></td>
                <td><span className={`badge badge-${g.status}`}>{STATUS_MAP[g.status]}</span></td>
                <td>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${g.progress}%` }} /></div>
                  <div className="progress-text">{g.progress}%</div>
                </td>
                <td>
                  {g.kpi_target > 0 && (
                    <div className="kpi-display">
                      <span className="kpi-current">{g.kpi_current}</span>
                      <span className="kpi-separator">/</span>
                      <span className="kpi-target">{g.kpi_target}</span>
                      <span className="kpi-unit">{g.kpi_unit}</span>
                    </div>
                  )}
                </td>
                <td>{g.quarter === 0 ? 'שנתי' : `Q${g.quarter}`}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {g.status !== 'completed' && (
                      <button className="btn" style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => updateStatus(g.id, g.status === 'planned' ? 'in_progress' : 'completed')}>
                        {g.status === 'planned' ? 'התחל' : 'השלם'}
                      </button>
                    )}
                    <button className="btn" style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                      onClick={() => deleteGoal(g.id)}>
                      {'\u2716'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>יעד חדש</h2>
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
                <label>עדיפות</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">נמוך</option>
                  <option value="medium">בינוני</option>
                  <option value="high">גבוה</option>
                  <option value="critical">קריטי</option>
                </select>
              </div>
              <div className="form-group">
                <label>רבעון</label>
                <select value={form.quarter} onChange={e => setForm({...form, quarter: Number(e.target.value)})}>
                  <option value={0}>שנתי</option>
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>יעד KPI</label>
                <input type="number" value={form.kpi_target} onChange={e => setForm({...form, kpi_target: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>יחידת מדידה</label>
                <input value={form.kpi_unit} onChange={e => setForm({...form, kpi_unit: e.target.value})} placeholder="%, עובדים, ₪..." />
              </div>
            </div>
            <div className="form-group">
              <label>תיאור</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCreate}>צור יעד</button>
              <button className="btn" onClick={() => setShowForm(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
