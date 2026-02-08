import React, { useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_HEB = { pending: 'ממתין', in_progress: 'בביצוע', completed: 'הושלם', overdue: 'באיחור' };

function MilestoneForm({ milestone, departments, year, onSave, onCancel }) {
  const [form, setForm] = useState({
    department_id: milestone?.department_id || '',
    title: milestone?.title || '',
    description: milestone?.description || '',
    due_date: milestone?.due_date || '',
    status: milestone?.status || 'pending',
    year: milestone?.year || year,
    quarter: milestone?.quarter || 1,
  });

  const handleSubmit = () => {
    if (!form.title || !form.department_id) return;
    onSave({ ...form, department_id: Number(form.department_id), due_date: form.due_date || null });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{milestone ? 'עריכת אבן דרך' : 'אבן דרך חדשה'}</h2>
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
        {milestone && (
          <div className="form-group">
            <label>סטטוס</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">ממתין</option>
              <option value="in_progress">בביצוע</option>
              <option value="completed">הושלם</option>
              <option value="overdue">באיחור</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label>תיאור</label>
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>{milestone ? 'שמור שינויים' : 'צור אבן דרך'}</button>
          <button className="btn" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

export default function Milestones({ milestones, departments, onRefresh, showToast, year }) {
  const [quarter, setQuarter] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editMs, setEditMs] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const deptMap = {};
  departments.forEach(d => { deptMap[d.id] = d; });

  const filtered = quarter === 0 ? milestones : milestones.filter(m => m.quarter === quarter);
  const sorted = [...filtered].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  const handleCreate = async (data) => {
    try {
      await axios.post('/api/milestones', data);
      setShowForm(false);
      showToast('אבן דרך נוצרה בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה ביצירת אבן דרך', 'error'); }
  };

  const handleEdit = async (data) => {
    try {
      await axios.put(`/api/milestones/${editMs.id}`, data);
      setEditMs(null);
      showToast('אבן דרך עודכנה בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה בעדכון', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/milestones/${confirmDelete.id}`);
      setConfirmDelete(null);
      showToast('אבן דרך נמחקה');
      onRefresh();
    } catch { showToast('שגיאה במחיקה', 'error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/milestones/${id}`, { status });
      showToast(`סטטוס עודכן ל${STATUS_HEB[status]}`);
      onRefresh();
    } catch { showToast('שגיאה בעדכון', 'error'); }
  };

  const exportCSV = () => {
    window.open(`/api/export/milestones?year=${year}`, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1>אבני דרך {year}</h1>
        <p>מעקב אחר אבני דרך מרכזיות לכל רבעון</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-right">
          <div className="quarter-tabs">
            <button className={`quarter-tab ${quarter === 0 ? 'active' : ''}`} onClick={() => setQuarter(0)}>הכל</button>
            {[1, 2, 3, 4].map(q => (
              <button key={q} className={`quarter-tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>Q{q}</button>
            ))}
          </div>
        </div>
        <div className="toolbar-left">
          <button className="btn" onClick={exportCSV}>ייצוא CSV</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ אבן דרך חדשה</button>
        </div>
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
                      {m.description && <div style={{ fontSize: 12, color: '#5a6a7a', marginTop: 4 }}>{m.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span className={`badge badge-${m.status}`}>{STATUS_HEB[m.status]}</span>
                      {m.status !== 'completed' && (
                        <button className="btn btn-sm" onClick={() => updateStatus(m.id, m.status === 'pending' ? 'in_progress' : 'completed')}>
                          {m.status === 'pending' ? 'התחל' : 'השלם'}
                        </button>
                      )}
                      <button className="btn btn-sm" onClick={() => setEditMs(m)}>ערוך</button>
                      <button className="btn btn-sm btn-danger-text" onClick={() => setConfirmDelete(m)}>{'\u2716'}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && <MilestoneForm departments={departments} year={year} onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editMs && <MilestoneForm milestone={editMs} departments={departments} year={year} onSave={handleEdit} onCancel={() => setEditMs(null)} />}
      {confirmDelete && <ConfirmDialog message={`למחוק את "${confirmDelete.title}"?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
