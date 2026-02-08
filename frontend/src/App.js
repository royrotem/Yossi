import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import OrgChart from './pages/OrgChart';
import Goals from './pages/Goals';
import Milestones from './pages/Milestones';
import './styles/App.css';

const YEAR = 2026;

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [year, setYear] = useState(YEAR);
  const [departments, setDepartments] = useState([]);
  const [tree, setTree] = useState([]);
  const [goals, setGoals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [seeded, setSeeded] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [dRes, tRes, gRes, mRes, sRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/departments/tree/full'),
        axios.get(`/api/goals?year=${year}`),
        axios.get(`/api/milestones?year=${year}`),
        axios.get(`/api/stats/${year}`),
      ]);
      setDepartments(dRes.data);
      setTree(tRes.data);
      setGoals(gRes.data);
      setMilestones(mRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('שגיאה בטעינת נתונים', 'error');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get('/api/departments');
        if (res.data.length === 0 && !seeded) {
          await axios.post('/api/seed');
          setSeeded(true);
        }
        fetchAll();
      } catch (err) {
        setTimeout(init, 2000);
      }
    };
    init();
  }, [fetchAll, seeded]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard stats={stats} departments={departments} goals={goals} year={year} />;
      case 'orgchart':
        return <OrgChart tree={tree} goals={goals} milestones={milestones} departments={departments} onRefresh={fetchAll} showToast={showToast} />;
      case 'goals':
        return <Goals goals={goals} departments={departments} onRefresh={fetchAll} showToast={showToast} year={year} />;
      case 'milestones':
        return <Milestones milestones={milestones} departments={departments} onRefresh={fetchAll} showToast={showToast} year={year} />;
      default:
        return <Dashboard stats={stats} departments={departments} goals={goals} year={year} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activePage={page} onNavigate={setPage} year={year} onYearChange={setYear} />
      <div className="main-content">
        {loading && !stats ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>טוען נתונים...</p>
          </div>
        ) : renderPage()}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
