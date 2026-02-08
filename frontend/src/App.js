import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrgChart from './pages/OrgChart';
import Goals from './pages/Goals';
import Milestones from './pages/Milestones';
import './styles/App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const YEAR = 2026;

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [departments, setDepartments] = useState([]);
  const [tree, setTree] = useState([]);
  const [goals, setGoals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState(null);
  const [seeded, setSeeded] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [dRes, tRes, gRes, mRes, sRes] = await Promise.all([
        axios.get(`${API}/api/departments`),
        axios.get(`${API}/api/departments/tree/full`),
        axios.get(`${API}/api/goals?year=${YEAR}`),
        axios.get(`${API}/api/milestones?year=${YEAR}`),
        axios.get(`${API}/api/stats/${YEAR}`),
      ]);
      setDepartments(dRes.data);
      setTree(tRes.data);
      setGoals(gRes.data);
      setMilestones(mRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  useEffect(() => {
    // Seed data on first load if empty
    const init = async () => {
      try {
        const res = await axios.get(`${API}/api/departments`);
        if (res.data.length === 0 && !seeded) {
          await axios.post(`${API}/api/seed`);
          setSeeded(true);
        }
        fetchAll();
      } catch (err) {
        // Retry after a short delay if backend not ready
        setTimeout(init, 2000);
      }
    };
    init();
  }, [fetchAll, seeded]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard stats={stats} departments={departments} goals={goals} />;
      case 'orgchart':
        return <OrgChart tree={tree} goals={goals} milestones={milestones} />;
      case 'goals':
        return <Goals goals={goals} departments={departments} onRefresh={fetchAll} />;
      case 'milestones':
        return <Milestones milestones={milestones} departments={departments} onRefresh={fetchAll} />;
      default:
        return <Dashboard stats={stats} departments={departments} goals={goals} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}
