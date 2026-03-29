import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import api from '../api';
import { getCurrencySymbol } from '../utils';
import SkeletonRow from '../SkeletonRow';

function Dashboard({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const companyCurrency = user?.company?.currency || 'INR';

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    setIsLoading(true);
    api.get('/expenses')
      .then(res => setExpenses(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const selectedId = location.pathname.startsWith('/expenses/') ? parseInt(location.pathname.split('/')[2]) : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="pill pill-approved"><span className="pill-dot"></span>Approved</span>;
      case 'REJECTED': return <span className="pill pill-rejected"><span className="pill-dot"></span>Rejected</span>;
      case 'IN_REVIEW': 
      case 'PENDING': return <span className="pill pill-pending"><span className="pill-dot"></span>Pending</span>;
      default: return <span className="pill pill-draft"><span className="pill-dot"></span>Draft</span>;
    }
  };

  const getChainHtml = (steps) => {
    if (!steps || steps.length === 0) return <div className="text-ink-3 text-xs italic">Auto-approved</div>;
    return (
      <div className="flex items-center gap-[3px]">
        {steps.map((step, idx) => {
          const isDone = ['APPROVED', 'REJECTED'].includes(step.status);
          const cName = step.status === 'APPROVED' ? 'done' : step.status === 'REJECTED' ? 'rej' : step.status === 'PENDING' ? 'active' : 'next';
          const initials = step.approver?.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          return (
            <React.Fragment key={step.id}>
              {idx > 0 && <div className={`w-[10px] h-[1.5px] ${isDone ? 'bg-green-mid' : 'bg-border2'}`}></div>}
              <div className={`chain-step ${cName}`} title={`${step.approver?.name} — ${step.status}`}>
                {initials}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    
    if (filter === 'all') return true;
    if (filter === 'pending') return e.status === 'IN_REVIEW' || e.status === 'PENDING';
    if (filter === 'approved') return e.status === 'APPROVED';
    if (filter === 'rejected') return e.status === 'REJECTED';
    return true;
  });

  const totalSubmitted = expenses.reduce((sum, e) => sum + e.companyAmount, 0);
  const totalApproved = expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.companyAmount, 0);
  const totalPending = expenses.filter(e => e.status === 'PENDING' || e.status === 'IN_REVIEW').reduce((sum, e) => sum + e.companyAmount, 0);
  const totalRejected = expenses.filter(e => e.status === 'REJECTED').reduce((sum, e) => sum + e.companyAmount, 0);

  const formatIN = (num) => new Intl.NumberFormat('en-IN').format(num);

  const pendingCount = expenses.filter(e => e.status === 'PENDING' || e.status === 'IN_REVIEW').length;
  const approvedCount = expenses.filter(e => e.status === 'APPROVED').length;
  const rejectedCount = expenses.filter(e => e.status === 'REJECTED').length;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="font-disp text-[26px] font-light tracking-tight text-ink-1 leading-tight">My Expenses</div>
      <div className="text-ink-3 text-[13px] mt-0.5 mb-6">
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} &nbsp;·&nbsp; {user.company?.name || 'Company'} &nbsp;·&nbsp; {companyCurrency} default currency
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat-card shadow-sm delay-0">
          <div className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 mb-1.5 flex justify-between">Total submitted <span className="text-[9px] bg-surface2 px-1 rounded text-ink-3">in {companyCurrency}</span></div>
          <div className="font-disp text-[24px] font-normal tracking-tight">{getCurrencySymbol(companyCurrency)}{formatIN(totalSubmitted)}</div>
          <div className="text-[12px] text-ink-3 mt-1">{expenses.length} claims this month</div>
        </div>
        <div className="stat-card shadow-sm delay-75">
          <div className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 mb-1.5 flex justify-between">Approved <span className="text-[9px] bg-surface2 px-1 rounded text-ink-3">in {companyCurrency}</span></div>
          <div className="font-disp text-[24px] font-normal tracking-tight text-green-text">{getCurrencySymbol(companyCurrency)}{formatIN(totalApproved)}</div>
          <div className="text-[12px] text-ink-3 mt-1">{approvedCount} claims reimbursed</div>
        </div>
        <div className="stat-card shadow-sm delay-150">
          <div className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 mb-1.5 flex justify-between">Pending <span className="text-[9px] bg-surface2 px-1 rounded text-ink-3">in {companyCurrency}</span></div>
          <div className="font-disp text-[24px] font-normal tracking-tight text-amber-text">{getCurrencySymbol(companyCurrency)}{formatIN(totalPending)}</div>
          <div className="text-[12px] text-ink-3 mt-1">{pendingCount} awaiting approval</div>
        </div>
        <div className="stat-card shadow-sm delay-200">
          <div className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 mb-1.5 flex justify-between">Rejected <span className="text-[9px] bg-surface2 px-1 rounded text-ink-3">in {companyCurrency}</span></div>
          <div className="font-disp text-[24px] font-normal tracking-tight text-red-text">{getCurrencySymbol(companyCurrency)}{formatIN(totalRejected)}</div>
          <div className="text-[12px] text-ink-3 mt-1">{rejectedCount} claims declined</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2.5 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input 
            type="text" 
            placeholder="Search expenses…" 
            className="w-full bg-surface border border-border2 rounded-sm1 py-2 pl-8 pr-3 text-[13.5px] text-ink-1 outline-none transition-colors focus:border-green-mid"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm1 text-[13px] transition-colors border ${filter === f ? 'bg-green-bg border-green-mid text-green-text font-medium' : 'bg-surface border-border2 text-ink-2 hover:bg-surface2'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <Link to="/expenses/new" className="md:ml-auto flex items-center gap-1.5 px-4 py-2 bg-green-text hover:opacity-90 transition-opacity text-white text-[13px] font-medium rounded-sm1">
          <Plus size={14} strokeWidth={2.5} /> New claim
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-border1">
                <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[11px] px-4 text-left bg-bg border-b border-border1">Expense</th>
                <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[11px] px-4 text-left bg-bg border-b border-border1">Est. {companyCurrency} amount</th>
                <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[11px] px-4 text-left bg-bg border-b border-border1">Status</th>
                <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[11px] px-4 text-left bg-bg border-b border-border1">Approval chain</th>
                <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[11px] px-4 text-left bg-bg border-b border-border1">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border1">
              {isLoading ? (
                <>
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                </>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      {user.role === 'EMPLOYEE' ? (
                        <>
                          <svg className="w-16 h-16 text-ink-3 mb-4 currentColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2z"/>
                            <path d="M16 14H8"/>
                            <path d="M16 10H8"/>
                            <path d="M10 6H8"/>
                          </svg>
                          <h3 className="text-[16px] font-semibold text-ink-1 mb-1">No expenses yet</h3>
                          <p className="text-[13px] text-ink-3 max-w-[250px] mb-6">Submit your first claim and track its approval in real time</p>
                          <Link to="/expenses/new" className="btn-primary">Submit Expense</Link>
                        </>
                      ) : user.role === 'ADMIN' ? (
                        <>
                          <svg className="w-16 h-16 text-ink-3 mb-4 currentColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                          </svg>
                          <h3 className="text-[16px] font-semibold text-ink-1 mb-1">No expenses submitted yet</h3>
                          <p className="text-[13px] text-ink-3 max-w-[250px]">Expenses submitted by your team will appear here</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-16 h-16 text-ink-3 mb-4 currentColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="m9 12 2 2 4-4"/>
                          </svg>
                          <h3 className="text-[16px] font-semibold text-ink-1 mb-1">You're all caught up</h3>
                          <p className="text-[13px] text-ink-3 max-w-[250px]">No expenses are waiting for your approval right now</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-ink-3 text-[13px]">
                    No expenses match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map(e => (
                  <tr 
                    key={e.id} 
                    onClick={() => navigate(`/expenses/${e.id}`)}
                    className={`cursor-pointer transition-colors hover:bg-surface2 ${e.id === selectedId ? 'bg-green-bg/50' : ''}`}
                  >
                    <td className="p-4 align-middle">
                      <div className="font-medium text-[13.5px] text-ink-1 break-words max-w-xs">{e.description}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5">{e.category} {e.submitter?.id !== user.id ? ` • ${e.submitter?.name}` : ''}</div>
                    </td>
                    <td className="p-4 align-middle relative">
                      <div className="font-mono text-[13.5px] font-medium text-ink-1">
                        {getCurrencySymbol(e.companyCurrency)}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits:2 }).format(e.companyAmount)}
                      </div>
                      {e.submittedCurrency !== e.companyCurrency && (
                         <div className="text-[11px] text-ink-3 mt-0.5" title={`Original: ${e.submittedAmount} ${e.submittedCurrency}`}>
                           <span className="font-mono">{getCurrencySymbol(e.submittedCurrency)}{e.submittedAmount}</span>
                         </div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {getStatusBadge(e.status)}
                    </td>
                    <td className="p-4 align-middle">
                      {getChainHtml(e.approvalSteps)}
                    </td>
                    <td className="p-4 align-middle text-[12.5px] text-ink-3">
                      {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
