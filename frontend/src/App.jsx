import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutGrid, FilePlus, Users } from 'lucide-react';
import api from './api';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewExpense from './pages/NewExpense';
import ExpenseDetail from './pages/ExpenseDetail';
import AdminUsers from './pages/AdminUsers';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const getInitials = (name) => {
    if(!name) return 'U';
    return name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg text-ink-1">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="*" element={<Login setUser={setUser} />} />
        </Routes>
      </div>
    );
  }

  const isDetailOpen = location.pathname.startsWith('/expenses/') && location.pathname !== '/expenses/new';

  return (
    <div className={`grid min-h-screen bg-bg transition-all duration-300 ${isDetailOpen ? 'md:grid-cols-[220px_1fr_360px]' : 'md:grid-cols-[220px_1fr]'} grid-rows-[56px_1fr]`}>
      {/* TOPBAR */}
      <header className="col-span-full bg-surface border-b border-border1 flex items-center px-6 gap-4 z-20">
        <span className="font-disp text-[18px] tracking-tight text-ink-1">
          expense<span className="italic text-green-text font-serif">flow</span>
        </span>
        <div className="flex-1"></div>
        <div className="text-[13px] text-ink-2 mr-1">{user.name}</div>
        <div className="w-[32px] h-[32px] rounded-full bg-green-bg text-green-text text-[11px] font-semibold flex items-center justify-center border-[1.5px] border-green-mid cursor-pointer" onClick={handleLogout} title="Click to logout">
          {getInitials(user.name)}
        </div>
      </header>

      {/* SIDEBAR */}
      <nav className="hidden md:flex flex-col bg-surface border-r border-border1 p-5 px-3 gap-0.5 z-10">
        <div className="text-[10px] font-semibold tracking-widest text-ink-3 uppercase py-2 px-2.5 mt-2">Menu</div>
        
        <Link to="/dashboard" className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-[8px] text-[13.5px] transition-colors ${location.pathname==='/dashboard' || location.pathname==='/' || isDetailOpen ? 'bg-green-bg text-green-text font-medium' : 'text-ink-2 hover:bg-surface2 hover:text-ink-1'}`}>
          <LayoutGrid size={16} strokeWidth={location.pathname==='/dashboard' || isDetailOpen ? 2:1.5} />
          My Expenses
        </Link>
        <Link to="/expenses/new" className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-[8px] text-[13.5px] transition-colors ${location.pathname==='/expenses/new' ? 'bg-green-bg text-green-text font-medium' : 'text-ink-2 hover:bg-surface2 hover:text-ink-1'}`}>
          <FilePlus size={16} strokeWidth={location.pathname==='/expenses/new'?2:1.5} />
          New Claim
        </Link>

        {user.role === 'ADMIN' && (
          <>
            <div className="text-[10px] font-semibold tracking-widest text-ink-3 uppercase py-2 px-2.5 mt-4">Settings</div>
            <Link to="/admin/users" className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-[8px] text-[13.5px] transition-colors ${location.pathname==='/admin/users' ? 'bg-green-bg text-green-text font-medium' : 'text-ink-2 hover:bg-surface2 hover:text-ink-1'}`}>
              <Users size={16} strokeWidth={location.pathname==='/admin/users'?2:1.5} />
              Manage Users
            </Link>
          </>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className="p-[28px] md:px-[32px] overflow-y-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/admin/users" element={<AdminUsers user={user} />} />
          <Route path="/expenses/new" element={<NewExpense user={user} />} />
          <Route path="/expenses/:id" element={<Dashboard user={user} />} />
        </Routes>
      </main>

      {/* DETAIL RIGHT PANEL */}
      {isDetailOpen && (
        <aside className="hidden md:block bg-surface border-l border-border1 overflow-y-auto">
          <Routes>
            <Route path="/expenses/:id" element={<ExpenseDetail user={user} />} />
          </Routes>
        </aside>
      )}
    </div>
  );
}

export default App;
