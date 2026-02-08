import React, { useState } from 'react';
import axios from 'axios';
import { Tree, TreeNode } from 'react-organizational-chart';
import ConfirmDialog from '../components/ConfirmDialog';

function OrgNode({ dept, onSelect }) {
  return (
    <div className="org-node" style={{ borderTopColor: dept.color, borderTopWidth: 3 }} onClick={() => onSelect(dept)}>
      <div className="node-name">{dept.name}</div>
      {dept.head_name && <div className="node-head">{dept.head_name} | {dept.head_title}</div>}
      <div className="node-stats">
        {dept.headcount > 0 && <span>{'\u{1F465}'} {dept.headcount}</span>}
        {dept.budget > 0 && <span>{'\u{1F4B0}'} {(dept.budget / 1000000).toFixed(1)}M</span>}
      </div>
    </div>
  );
}

function DeptTreeNode({ node, onSelect }) {
  if (!node.children || node.children.length === 0) {
    return <TreeNode label={<OrgNode dept={node} onSelect={onSelect} />} />;
  }
  return (
    <TreeNode label={<OrgNode dept={node} onSelect={onSelect} />}>
      {node.children.map(child => (
        <DeptTreeNode key={child.id} node={child} onSelect={onSelect} />
      ))}
    </TreeNode>
  );
}

function DeptForm({ dept, departments, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: dept?.name || '',
    name_en: dept?.name_en || '',
    parent_id: dept?.parent_id || '',
    head_name: dept?.head_name || '',
    head_title: dept?.head_title || '',
    color: dept?.color || '#4A90D9',
    budget: dept?.budget || 0,
    headcount: dept?.headcount || 0,
    description: dept?.description || '',
  });

  const handleSubmit = () => {
    if (!form.name) return;
    onSave({ ...form, parent_id: form.parent_id ? Number(form.parent_id) : null });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{dept ? 'עריכת אגף' : 'אגף חדש'}</h2>
        <div className="form-row">
          <div className="form-group">
            <label>שם (עברית)</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>שם (אנגלית)</label>
            <input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>אגף אב</label>
          <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
            <option value="">ללא (שורש)</option>
            {departments.filter(d => !dept || d.id !== dept.id).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>שם מנהל</label>
            <input value={form.head_name} onChange={e => setForm({...form, head_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>תפקיד</label>
            <input value={form.head_title} onChange={e => setForm({...form, head_title: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>תקציב (₪)</label>
            <input type="number" value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>כוח אדם</label>
            <input type="number" value={form.headcount} onChange={e => setForm({...form, headcount: Number(e.target.value)})} />
          </div>
        </div>
        <div className="form-group">
          <label>צבע</label>
          <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} style={{ height: 40 }} />
        </div>
        <div className="form-group">
          <label>תיאור</label>
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>{dept ? 'שמור' : 'צור אגף'}</button>
          <button className="btn" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

function DeptDetailModal({ dept, onClose, goals, milestones, onEdit, onDelete }) {
  const deptGoals = goals.filter(g => g.department_id === dept.id);
  const deptMs = milestones.filter(m => m.department_id === dept.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
        <h2 style={{ borderBottom: `3px solid ${dept.color}`, paddingBottom: 12 }}>
          {dept.name}
        </h2>
        {dept.name_en && <p style={{ color: '#8899aa', marginBottom: 16 }}>{dept.name_en}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="stat-card" style={{ padding: 12 }}>
            <div className="stat-label">ראש אגף</div>
            <div style={{ fontWeight: 600 }}>{dept.head_name || '-'}</div>
            <div style={{ fontSize: 12, color: '#8899aa' }}>{dept.head_title}</div>
          </div>
          <div className="stat-card" style={{ padding: 12 }}>
            <div className="stat-label">כוח אדם</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: '#4A90D9' }}>{dept.headcount}</div>
          </div>
          <div className="stat-card" style={{ padding: 12 }}>
            <div className="stat-label">תקציב</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: '#a78bfa' }}>
              {'\u20AA'}{(dept.budget / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="stat-card" style={{ padding: 12 }}>
            <div className="stat-label">יעדים פעילים</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: '#34d399' }}>{deptGoals.length}</div>
          </div>
        </div>

        {deptGoals.length > 0 && (
          <>
            <h3 style={{ marginBottom: 12 }}>יעדים</h3>
            {deptGoals.map(g => (
              <div key={g.id} style={{ padding: 12, background: '#0f1623', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{g.title}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className={`badge badge-${g.status}`}>
                    {g.status === 'planned' ? 'מתוכנן' : g.status === 'in_progress' ? 'בביצוע' : g.status === 'completed' ? 'הושלם' : 'בוטל'}
                  </span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${g.progress}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#8899aa' }}>{g.progress}%</span>
                </div>
              </div>
            ))}
          </>
        )}

        {deptMs.length > 0 && (
          <>
            <h3 style={{ margin: '16px 0 12px' }}>אבני דרך</h3>
            {deptMs.map(m => (
              <div key={m.id} style={{
                padding: 10, background: '#0f1623', borderRadius: 8, marginBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{m.title}</span>
                <span className={`badge badge-${m.status}`}>
                  {m.status === 'completed' ? 'הושלם' : m.status === 'in_progress' ? 'בביצוע' : m.status === 'pending' ? 'ממתין' : 'באיחור'}
                </span>
              </div>
            ))}
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onEdit(dept)}>ערוך</button>
          <button className="btn btn-danger" onClick={() => onDelete(dept)}>מחק</button>
          <button className="btn" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}

export default function OrgChart({ tree, goals, milestones, departments, onRefresh, showToast }) {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreate = async (data) => {
    try {
      await axios.post('/api/departments', data);
      setShowForm(false);
      showToast('אגף נוצר בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה ביצירת אגף', 'error'); }
  };

  const handleEdit = async (data) => {
    try {
      await axios.put(`/api/departments/${editDept.id}`, data);
      setEditDept(null);
      setSelected(null);
      showToast('אגף עודכן בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה בעדכון אגף', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/departments/${confirmDelete.id}`);
      setConfirmDelete(null);
      setSelected(null);
      showToast('אגף נמחק בהצלחה');
      onRefresh();
    } catch { showToast('שגיאה במחיקת אגף', 'error'); }
  };

  if (!tree || tree.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>מבנה ארגוני</h1>
          <p>צור את האגף הראשון כדי להתחיל</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ אגף חדש</button>
        {showForm && <DeptForm departments={[]} onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>מבנה ארגוני</h1>
          <p>לחץ על אגף לצפייה בפרטים, עריכה או מחיקה</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ אגף חדש</button>
      </div>

      <div className="org-chart-container">
        {tree.map(root => (
          <Tree key={root.id} lineWidth="2px" lineColor="#2d3d50" lineBorderRadius="8px"
                label={<OrgNode dept={root} onSelect={setSelected} />}>
            {(root.children || []).map(child => (
              <DeptTreeNode key={child.id} node={child} onSelect={setSelected} />
            ))}
          </Tree>
        ))}
      </div>

      {selected && !editDept && (
        <DeptDetailModal
          dept={selected} goals={goals} milestones={milestones}
          onClose={() => setSelected(null)}
          onEdit={(d) => { setSelected(null); setEditDept(d); }}
          onDelete={(d) => { setSelected(null); setConfirmDelete(d); }}
        />
      )}

      {showForm && <DeptForm departments={departments} onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editDept && <DeptForm dept={editDept} departments={departments} onSave={handleEdit} onCancel={() => setEditDept(null)} />}
      {confirmDelete && <ConfirmDialog message={`למחוק את "${confirmDelete.name}"?`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
