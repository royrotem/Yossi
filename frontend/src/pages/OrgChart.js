import React, { useState } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';

function OrgNode({ dept, onSelect }) {
  return (
    <div
      className="org-node"
      style={{ borderTopColor: dept.color, borderTopWidth: 3 }}
      onClick={() => onSelect(dept)}
    >
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
    return (
      <TreeNode label={<OrgNode dept={node} onSelect={onSelect} />} />
    );
  }
  return (
    <TreeNode label={<OrgNode dept={node} onSelect={onSelect} />}>
      {node.children.map(child => (
        <DeptTreeNode key={child.id} node={child} onSelect={onSelect} />
      ))}
    </TreeNode>
  );
}

function DeptDetailModal({ dept, onClose, goals, milestones }) {
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
              <div key={g.id} style={{
                padding: 12, background: '#0f1623', borderRadius: 8, marginBottom: 8
              }}>
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
          <button className="btn" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}

export default function OrgChart({ tree, goals, milestones }) {
  const [selected, setSelected] = useState(null);

  if (!tree || tree.length === 0) {
    return <div className="empty-state"><div className="empty-icon">{'\u{1F3E2}'}</div><p>אין נתוני מבנה ארגוני</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>מבנה ארגוני</h1>
        <p>לחץ על אגף לצפייה בפרטים מלאים, יעדים ואבני דרך</p>
      </div>

      <div className="org-chart-container">
        {tree.map(root => (
          <Tree
            key={root.id}
            lineWidth="2px"
            lineColor="#2d3d50"
            lineBorderRadius="8px"
            label={<OrgNode dept={root} onSelect={setSelected} />}
          >
            {(root.children || []).map(child => (
              <DeptTreeNode key={child.id} node={child} onSelect={setSelected} />
            ))}
          </Tree>
        ))}
      </div>

      {selected && (
        <DeptDetailModal
          dept={selected}
          goals={goals}
          milestones={milestones}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
