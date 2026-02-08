import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#4A90D9', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];
const STATUS_COLORS = { planned: '#60a5fa', in_progress: '#fbbf24', completed: '#34d399', cancelled: '#f87171' };

export default function Dashboard({ stats, departments, goals }) {
  if (!stats) return <div className="empty-state"><div className="empty-icon">...</div><p>טוען נתונים...</p></div>;

  const quarterData = Object.entries(stats.by_quarter || {}).map(([q, v]) => ({
    name: `Q${q}`,
    goals: v.goals,
    milestones: v.milestones,
    completed: v.completed_milestones,
  }));

  const statusData = Object.entries(stats.by_status || {}).map(([k, v]) => ({
    name: k === 'planned' ? 'מתוכנן' : k === 'in_progress' ? 'בביצוע' : k === 'completed' ? 'הושלם' : 'בוטל',
    value: v,
    key: k,
  }));

  const priorityData = Object.entries(stats.by_priority || {}).map(([k, v]) => ({
    name: k === 'low' ? 'נמוך' : k === 'medium' ? 'בינוני' : k === 'high' ? 'גבוה' : 'קריטי',
    value: v,
  }));

  const deptBudget = departments.map(d => ({
    name: d.name.replace('אגף ', ''),
    budget: d.budget / 1000000,
    headcount: d.headcount,
  })).filter(d => d.budget > 0).sort((a, b) => b.budget - a.budget);

  const progressData = goals.map(g => ({
    name: g.title.substring(0, 25),
    progress: g.progress,
    fill: g.progress >= 80 ? '#34d399' : g.progress >= 40 ? '#fbbf24' : '#f87171',
  })).sort((a, b) => b.progress - a.progress).slice(0, 8);

  return (
    <div>
      <div className="page-header">
        <h1>דשבורד שנתי 2026</h1>
        <p>סקירה כללית של ביצועי האגפים והיעדים השנתיים</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F3E2}'}</div>
          <div className="stat-value">{stats.total_departments}</div>
          <div className="stat-label">אגפים ומחלקות</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F3AF}'}</div>
          <div className="stat-value">{stats.total_goals}</div>
          <div className="stat-label">יעדים שנתיים</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u2705'}</div>
          <div className="stat-value">{stats.completed_goals}</div>
          <div className="stat-label">יעדים שהושלמו</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F4C8}'}</div>
          <div className="stat-value">{stats.avg_progress}%</div>
          <div className="stat-label">ממוצע התקדמות</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F4B0}'}</div>
          <div className="stat-value">{(stats.total_budget / 1000000).toFixed(1)}M</div>
          <div className="stat-label">תקציב כולל (₪)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F465}'}</div>
          <div className="stat-value">{stats.total_headcount}</div>
          <div className="stat-label">כוח אדם</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>יעדים ואבני דרך לפי רבעון</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={quarterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis dataKey="name" stroke="#5a6a7a" />
              <YAxis stroke="#5a6a7a" />
              <Tooltip
                contentStyle={{ background: '#1e2a3a', border: '1px solid #2d3d50', borderRadius: 8, direction: 'rtl' }}
              />
              <Bar dataKey="goals" name="יעדים" fill="#4A90D9" radius={[4,4,0,0]} />
              <Bar dataKey="milestones" name="אבני דרך" fill="#a78bfa" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="הושלמו" fill="#34d399" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>סטטוס יעדים</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                   paddingAngle={5} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e2a3a', border: '1px solid #2d3d50', borderRadius: 8, direction: 'rtl' }} />
              <Legend formatter={(value, entry) => {
                const item = statusData.find(s => s.value === entry.payload.value);
                return item ? item.name : value;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>תקציב לפי אגף (מיליון ₪)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptBudget} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis type="number" stroke="#5a6a7a" />
              <YAxis type="category" dataKey="name" stroke="#5a6a7a" width={80} />
              <Tooltip contentStyle={{ background: '#1e2a3a', border: '1px solid #2d3d50', borderRadius: 8, direction: 'rtl' }} />
              <Bar dataKey="budget" name="תקציב (M₪)" fill="#a78bfa" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>התקדמות יעדים</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={progressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis type="number" domain={[0, 100]} stroke="#5a6a7a" />
              <YAxis type="category" dataKey="name" stroke="#5a6a7a" width={120} />
              <Tooltip contentStyle={{ background: '#1e2a3a', border: '1px solid #2d3d50', borderRadius: 8, direction: 'rtl' }} />
              <Bar dataKey="progress" name="התקדמות %" radius={[0,4,4,0]}>
                {progressData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
