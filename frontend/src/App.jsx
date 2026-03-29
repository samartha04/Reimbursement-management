import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutGrid, FilePlus, Users, Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from './api';
import { useNotifications } from './useNotifications';
import SkeletonRow from './SkeletonRow';

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
    const token = sessionStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          sessionStorage.removeItem('token');
        });
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const getInitials = (name) => {
    if(!name) return 'U';
    return name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { notifications, unreadCount, loading: notifLoading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('#notification-bell-container')) {
        setIsDropdownOpen(false);
      }
      if (!e.target.closest('#user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const timeAgo = (dateStr) => {
    const minDiff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (minDiff < 1) return 'Just now';
    if (minDiff < 60) return `${minDiff} min ago`;
    const hrDiff = Math.floor(minDiff / 60);
    if (hrDiff < 24) return `${hrDiff} hr ago`;
    if (hrDiff < 48) return 'Yesterday';
    return `${Math.floor(hrDiff / 24)} days ago`;
  };

  const getNotifIcon = (type) => {
    if (type === 'EXPENSE_APPROVED') return <CheckCircle2 size={16} className="text-green-text mt-0.5 shrink-0" />;
    if (type === 'EXPENSE_REJECTED') return <XCircle size={16} className="text-red-text mt-0.5 shrink-0" />;
    return <Clock size={16} className="text-amber-text mt-0.5 shrink-0" />;
  };

  const handleNotifClick = (n) => {
    if (!n.isRead) markAsRead(n.id);
    setIsDropdownOpen(false);
    if (n.expenseId) navigate(`/expenses/${n.expenseId}`);
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
        
        <div id="notification-bell-container" className="relative mr-4">
          <div className="cursor-pointer relative p-1 text-ink-2 hover:text-ink-1 transition-colors" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 w-[16px] h-[16px] bg-red-text text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-surface border border-border1 rounded-[12px] shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-border1 flex items-center justify-between bg-surface2">
                <span className="font-semibold text-[13.5px]">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[12px] text-green-text hover:text-green-mid font-medium">Mark all read</button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1">
                {notifLoading ? (
                  <>
                    <SkeletonRow cols={1} />
                    <SkeletonRow cols={1} />
                    <SkeletonRow cols={1} />
                  </>
                ) : notifications.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-ink-3">
                     <CheckCircle2 size={32} className="mb-2 opacity-50" />
                     <p className="text-[13px] font-medium text-ink-2">You're all caught up</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-2.5 rounded-[8px] flex items-start gap-3 cursor-pointer transition-colors ${n.isRead ? 'hover:bg-surface2' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                      {getNotifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink-1 leading-tight mb-1">{n.title}</div>
                        <div className="text-[12px] text-ink-2 leading-snug">{n.body}</div>
                        <div className="text-[10px] text-ink-3 mt-1.5 font-medium">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div id="user-menu-container" className="relative flex items-center gap-2 cursor-pointer ml-1" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
          <div className="text-[13px] text-ink-2 font-medium">{user.name}</div>
          <div className="w-[32px] h-[32px] rounded-full bg-green-bg text-green-text text-[11px] font-semibold flex items-center justify-center border-[1.5px] border-green-mid transition-transform hover:scale-105">
            {getInitials(user.name)}
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-[240px] bg-surface border border-border1 rounded-[12px] shadow-lg z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-border1 bg-surface2">
                <div className="font-semibold text-ink-1 text-[14px]">{user.name}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">{user.email}</div>
                <div className="mt-3 inline-flex items-center px-2 py-1 rounded-sm1 bg-green-bg/50 border border-green-text/30 text-green-mid text-[10.5px] font-bold tracking-wider uppercase">
                  {user.role} {user.isManagerApprover ? '— Approver' : ''}
                </div>
              </div>
              <div className="p-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-text hover:bg-red-bg rounded-[8px] transition-colors">
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
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
