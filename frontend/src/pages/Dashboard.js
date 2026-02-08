import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4A90D9', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];
const STATUS_COLORS = { planned: '#60a5fa', in_progress: '#fbbf24', completed: '#34d399', cancelled: '#f87171' };

export default function Dashboard({ stats, departments, goals, year }) {
  if (!stats) return <div className="loading-container"><div className="loading-spinner" /><p>טוען נתונים...</p></div>;

  const quarterData = Object.entries(stats.by_quarter || {}).map(([q, v]) => ({
    name: `Q${q}`,
    goals: v.goals,
    milestones: v.milestones,
    completed: v.completed_milestones,
  }));

  const statusData = Object.entries(stats.by_status || {}).map(([k, v]) => ({
    name: k === 'planned' ? '\u05DE\u05EA\u05D5\u05DB\u05E0\u05DF' : k === 'in_progress' ? '\u05D1\u05D1\u05D9\u05E6\u05D5\u05E2' : k === 'completed' ? '\u05D4\u05D5\u05E9\u05DC\u05DD' : '\u05D1\u05D5\u05D8\u05DC',
    value: v,
    key: k,
  })).filter(d => d.value > 0);

  const deptBudget = departments.map(d => ({
    name: d.name.replace('\u05D0\u05D2\u05E3 ', ''),
    budget: d.budget / 1000000,
    headcount: d.headcount,
  })).filter(d => d.budget > 0).sort((a, b) => b.budget - a.budget).slice(0, 8);

  const progressData = goals.map(g => ({
    name: g.title.length > 22 ? g.title.substring(0, 22) + '...' : g.title,
    progress: g.progress,
    fill: g.progress >= 80 ? '#34d399' : g.progress >= 40 ? '#fbbf24' : '#f87171',
  })).sort((a, b) => b.progress - a.progress).slice(0, 8);

  const deptPerformance = (stats.by_department || []).map(d => ({
    name: d.name.replace('\u05D0\u05D2\u05E3 ', ''),
    progress: d.avg_progress,
    goals: d.goals,
  }));

  const tooltipStyle = { background: '#1e2a3a', border: '1px solid #2d3d50', borderRadius: 8, direction: 'rtl' };

  return (
    <div>
      <div className="page-header">
        <h1>\u05D3\u05E9\u05D1\u05D5\u05E8\u05D3 \u05E9\u05E0\u05EA\u05D9 {year}</h1>
        <p>\u05E1\u05E7\u05D9\u05E8\u05D4 \u05DB\u05DC\u05DC\u05D9\u05EA \u05E9\u05DC \u05D1\u05D9\u05E6\u05D5\u05E2\u05D9 \u05D4\u05D0\u05D2\u05E4\u05D9\u05DD \u05D5\u05D4\u05D9\u05E2\u05D3\u05D9\u05DD \u05D4\u05E9\u05E0\u05EA\u05D9\u05D9\u05DD</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F3E2}'}</div>
          <div className="stat-value">{stats.total_departments}</div>
          <div className="stat-label">\u05D0\u05D2\u05E4\u05D9\u05DD \u05D5\u05DE\u05D7\u05DC\u05E7\u05D5\u05EA</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F3AF}'}</div>
          <div className="stat-value">{stats.total_goals}</div>
          <div className="stat-label">\u05D9\u05E2\u05D3\u05D9\u05DD \u05E9\u05E0\u05EA\u05D9\u05D9\u05DD</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u2705'}</div>
          <div className="stat-value">{stats.completed_goals}</div>
          <div className="stat-label">\u05D9\u05E2\u05D3\u05D9\u05DD \u05E9\u05D4\u05D5\u05E9\u05DC\u05DE\u05D5</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F4C8}'}</div>
          <div className="stat-value">{stats.avg_progress}%</div>
          <div className="stat-label">\u05DE\u05DE\u05D5\u05E6\u05E2 \u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F4B0}'}</div>
          <div className="stat-value">{(stats.total_budget / 1000000).toFixed(1)}M</div>
          <div className="stat-label">\u05EA\u05E7\u05E6\u05D9\u05D1 \u05DB\u05D5\u05DC\u05DC (\u20AA)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{'\u{1F465}'}</div>
          <div className="stat-value">{stats.total_headcount}</div>
          <div className="stat-label">\u05DB\u05D5\u05D7 \u05D0\u05D3\u05DD</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>\u05D9\u05E2\u05D3\u05D9\u05DD \u05D5\u05D0\u05D1\u05E0\u05D9 \u05D3\u05E8\u05DA \u05DC\u05E4\u05D9 \u05E8\u05D1\u05E2\u05D5\u05DF</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={quarterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis dataKey="name" stroke="#5a6a7a" />
              <YAxis stroke="#5a6a7a" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="goals" name="\u05D9\u05E2\u05D3\u05D9\u05DD" fill="#4A90D9" radius={[4,4,0,0]} />
              <Bar dataKey="milestones" name="\u05D0\u05D1\u05E0\u05D9 \u05D3\u05E8\u05DA" fill="#a78bfa" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="\u05D4\u05D5\u05E9\u05DC\u05DE\u05D5" fill="#34d399" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D9\u05E2\u05D3\u05D9\u05DD</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                   paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>\u05EA\u05E7\u05E6\u05D9\u05D1 \u05DC\u05E4\u05D9 \u05D0\u05D2\u05E3 (\u05DE\u05D9\u05DC\u05D9\u05D5\u05DF \u20AA)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptBudget} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis type="number" stroke="#5a6a7a" />
              <YAxis type="category" dataKey="name" stroke="#5a6a7a" width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="budget" name="\u05EA\u05E7\u05E6\u05D9\u05D1 (M\u20AA)" fill="#a78bfa" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA \u05D9\u05E2\u05D3\u05D9\u05DD</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={progressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
              <XAxis type="number" domain={[0, 100]} stroke="#5a6a7a" />
              <YAxis type="category" dataKey="name" stroke="#5a6a7a" width={130} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="progress" name="\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA %"  radius={[0,4,4,0]}>
                {progressData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {deptPerformance.length > 0 && (
          <div className="chart-card full-width">
            <h3>\u05D1\u05D9\u05E6\u05D5\u05E2\u05D9\u05DD \u05DC\u05E4\u05D9 \u05D0\u05D2\u05E3</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3d50" />
                <XAxis dataKey="name" stroke="#5a6a7a" />
                <YAxis stroke="#5a6a7a" domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="progress" name="\u05DE\u05DE\u05D5\u05E6\u05E2 \u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA %" fill="#4A90D9" radius={[4,4,0,0]}>
                  {deptPerformance.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
