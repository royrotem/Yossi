import React, { useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_MAP = { planned: 'מתוכנן', in_progress: 'בביצוע', completed: 'הושלם', cancelled: 'בוטל' };
const PRIORITY_MAP = { low: 'נמוך', medium: 'בינוני', high: 'גבוה', critical: 'קריטי' };

function GoalForm({ goal, departments, year, onSave, onCancel }) {
  const [form, setForm] = useState({
    department_id: goal?.department_id || '',
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'general',
    priority: goal?.priority || 'medium',
    status: goal?.status || 'planned',
    progress: goal?.progress || 0,
    quarter: goal?.quarter ?? 0,
    year: goal?.year || year,
    kpi_target: goal?.kpi_target || 0,
    kpi_current: goal?.kpi_current || 0,
    kpi_unit: goal?.kpi_unit || '',
  });

  const handleSubmit = () => {
    if (!form.title || !form.department_id) return;
    onSave({ ...form, department_id: Number(form.department_id) });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{goal ? 'עריכת יעד' : 'יעד חדש'}</h2>
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
            <label>סטטוס</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="planned">מתוכנן</option>
              <option value="in_progress">בביצוע</option>
              <option value="completed">הושלם</option>
              <option value="cancelled">בוטל</option>
            </select>
          </div>
        </div>
        <div className="form-row">
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
          <div className="form-group">
            <label>התקדמות (%)</label>
            <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({...form, progress: Number(e.target.value)})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>יעד KPI</label>
            <input type="number" value={form.kpi_target} onChange={e => setForm({...form, kpi_target: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>KPI נוכחי</label>
            <input type="number" value={form.kpi_current} onChange={e => setForm({...form, kpi_current: Number(e.target.value)})} />
          </div>
        </div>
        <div className="form-group">
          <label>יחידת מדידה</label>
          <input value={form.kpi_unit} onChange={e => setForm({...form, kpi_unit: e.target.value})} placeholder="%, עובדים, ₪..." />
        </div>
        <div className="form-group">
          <label>תיאור</label>
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>{goal ? 'שמור שינויים' : 'צור יעד'}</button>
          <button className="btn" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

export default function Goals({ goals, departments, onRefresh, showToast, year }) {
  const [filter, setFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const deptMap = {};
  departments.forEach(d => { deptMap[d.id] = d.name; });

  let filtered = goals;
  if (filter !== 'all') filtered = filtered.filter(g => g.status === filter);
  if (deptFilter !== 'all') filtered = filtered.filter(g => g.department_id === Number(deptFilter));
  if (search) filtered = filtered.filter(g => g.title.includes(search));

  const handleCreate = async (data) => {
    try {
      await axios.post('/api/goals', data);
      setShowForm(false);
      showToast('יעד נוצר בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה ביצירת יעד', 'error'); }
  };

  const handleEdit = async (data) => {
    try {
      await axios.put(`/api/goals/${editGoal.id}`, data);
      setEditGoal(null);
      showToast('יעד עודכן בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה בעדכון יעד', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/goals/${confirmDelete.id}`);
      setConfirmDelete(null);
      showToast('יעד נמחק');
      onRefresh();
    } catch { showToast('שגיאה במחיקת יעד', 'error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const progress = status === 'completed' ? 100 : undefined;
      await axios.put(`/api/goals/${id}`, { status, ...(progress !== undefined ? { progress } : {}) });
      showToast(`סטטוס עודכן ל${STATUS_MAP[status]}`);
      onRefresh();
    } catch { showToast('שגיאה בעדכון', 'error'); }
  };

  const exportCSV = () => {
    window.open(`/api/export/goals?year=${year}`, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1>יעדים שנתיים {year}</h1>
        <p>ניהול ומעקב אחר יעדים שנתיים של כל האגפים</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-right">
          <div className="quarter-tabs">
            {[['all', 'הכל'], ['planned', 'מתוכנן'], ['in_progress', 'בביצוע'], ['completed', 'הושלם']].map(([k, v]) => (
              <button key={k} className={`quarter-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v}</button>
            ))}
          </div>
          <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="all">כל האגפים</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input className="search-input" placeholder="חיפוש יעד..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-left">
          <button className="btn" onClick={exportCSV}>ייצוא CSV</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ יעד חדש</button>
        </div>
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
                      <button className="btn btn-sm" onClick={() => updateStatus(g.id, g.status === 'planned' ? 'in_progress' : 'completed')}>
                        {g.status === 'planned' ? 'התחל' : 'השלם'}
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => setEditGoal(g)}>ערוך</button>
                    <button className="btn btn-sm btn-danger-text" onClick={() => setConfirmDelete(g)}>{'\u2716'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <GoalForm departments={departments} year={year} onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editGoal && <GoalForm goal={editGoal} departments={departments} year={year} onSave={handleEdit} onCancel={() => setEditGoal(null)} />}
      {confirmDelete && <ConfirmDialog message={`למחוק את "${confirmDelete.title}"?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
