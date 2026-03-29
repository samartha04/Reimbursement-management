import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Check, X, ArrowLeft, Zap, Image as ImageIcon } from 'lucide-react';
import api from '../api';
import { getCurrencySymbol } from '../utils';

function ExpenseDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    if (lightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  const fetchExpense = () => {
    setLoading(true);
    api.get(`/expenses/${id}`).then(res => {
      setExpense(res.data);
      setLoading(false);
    }).catch(() => {
      navigate('/dashboard');
    });
  };

  useEffect(() => {
    fetchExpense();
  }, [id, navigate]);

  if (!id) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 gap-3">
        <FileText size={48} strokeWidth={1} className="text-border2" />
        <p className="text-[13px] text-ink-3 text-center max-w-[180px] leading-relaxed">
          Select an expense to view details and approval status.
        </p>
      </div>
    );
  }

  if (loading || !expense) {
    return (
      <div className="h-full p-[28px] px-[24px] animate-[pulse_1.5s_infinite]">
        <div className="h-4 bg-surface2 rounded w-24 mb-3"></div>
        <div className="h-6 bg-surface2 rounded w-64 mb-6"></div>
        
        <div className="bg-bg border border-border1 rounded-[8px] p-4 mb-5 shadow-sm">
           <div className="h-8 bg-surface2 rounded w-40 mb-2"></div>
           <div className="h-4 bg-surface2 rounded w-32"></div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-8">
          <div className="bg-bg rounded-[8px] h-14"></div>
          <div className="bg-bg rounded-[8px] h-14"></div>
          <div className="bg-bg rounded-[8px] h-14"></div>
          <div className="bg-bg rounded-[8px] h-14"></div>
        </div>

        <div className="text-[10.5px] font-semibold tracking-[.07em] uppercase text-ink-3 mb-4">Approval Timeline</div>
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
             <div className="w-6 h-6 rounded-full bg-surface2 shrink-0"></div>
             <div className="h-4 bg-surface2 rounded w-32"></div>
          </div>
          <div className="flex gap-3 items-center">
             <div className="w-6 h-6 rounded-full bg-surface2 shrink-0"></div>
             <div className="h-4 bg-surface2 rounded w-48"></div>
          </div>
          <div className="flex gap-3 items-center">
             <div className="w-6 h-6 rounded-full bg-surface2 shrink-0"></div>
             <div className="h-4 bg-surface2 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (action) => {
    try {
      await api.post(`/expenses/${id}/approve`, { action, comment });
      fetchExpense();
      setComment('');
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const pendingStep = expense.approvalSteps?.find(s => s.status === 'PENDING' && s.approverId === user?.id);
  const canAct = !!pendingStep || user?.role === 'ADMIN';

  const formatAmount = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}).format(num);

  const getPill = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="pill pill-approved"><span className="pill-dot"></span>Approved</span>;
      case 'REJECTED': return <span className="pill pill-rejected"><span className="pill-dot"></span>Rejected</span>;
      case 'IN_REVIEW':
      case 'PENDING': return <span className="pill pill-pending"><span className="pill-dot"></span>Pending</span>;
      default: return <span className="pill pill-draft"><span className="pill-dot"></span>Draft</span>;
    }
  };

  const getInitials = (n) => n ? n.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'U';

  const checkAutoApprovalBadge = () => {
    if (!expense.autoApprovedByRule) return null;
    const r = expense.autoApprovedByRule;
    let label = '';
    if (r.ruleType === 'PERCENTAGE') label = `Auto-approved via ${r.percentageThreshold}% rule`;
    else if (r.ruleType === 'SPECIFIC_APPROVER') label = `Auto-approved: Key Approver trigger`;
    else label = `Auto-approved via Hybrid Rule`;

    return (
      <div className="bg-amber-bg/50 border border-amber-text/30 text-amber-text px-3 py-2 rounded-sm1 text-[11.5px] font-medium flex items-center gap-1.5 mt-4">
        <Zap size={14} className="fill-amber-text" /> 
        <span className="truncate" title={r.name}>{label} ({r.name})</span>
      </div>
    );
  };

  const isMultiCurrency = expense.submittedCurrency !== expense.companyCurrency;

  return (
    <>
      <div className="h-full flex flex-col animate-in slide-in-from-right-2 duration-300">
        <div className="md:hidden flex items-center p-4 border-b border-border1 bg-bg">
           <Link to="/dashboard" className="flex items-center gap-1.5 text-ink-2 text-[13px] font-medium">
             <ArrowLeft size={16} /> Back
           </Link>
        </div>
        <div className="p-[28px] px-[24px]">
          
          <div className="mb-5">
            <div className="text-[11px] font-semibold tracking-[.07em] uppercase text-ink-3 mb-1.5">{expense.category}</div>
            <div className="font-disp text-[20px] font-normal tracking-[-0.3px] leading-[1.3] mb-1">{expense.description}</div>
            <div className="text-[12px] text-ink-3">
               {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="bg-bg border border-border1 rounded-[8px] p-4 mb-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10.5px] text-ink-3 uppercase tracking-[.06em] font-semibold">Amount Requested</div>
              <div className="shrink-0 leading-none">{getPill(expense.status)}</div>
            </div>
            <div>
               <div className="font-mono text-[24px] font-medium text-ink-1">
                 {getCurrencySymbol(expense.submittedCurrency)}{formatAmount(expense.submittedAmount)} <span className="text-[14px] text-ink-2 font-normal ml-0.5">{expense.submittedCurrency}</span>
               </div>
               {isMultiCurrency && (
                 <div className="text-[12.5px] text-ink-3 font-medium mt-1">
                   ≈ {getCurrencySymbol(expense.companyCurrency)}{formatAmount(expense.companyAmount)} {expense.companyCurrency} <span className="text-[11px] font-normal opacity-80 ml-1">(@ {expense.exchangeRate} rate)</span>
                 </div>
               )}
            </div>

            {expense.receiptImageUrl && (
               <div className="pt-3 mt-3 border-t border-border1 border-dashed">
                 <button onClick={() => setLightboxOpen(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-text hover:bg-green-mid text-white rounded-md1 text-[13px] font-medium transition-colors shadow-sm">
                    <ImageIcon size={16} /> View Scanned Receipt
                 </button>
               </div>
            )}
          </div>

          <div className="text-[10.5px] font-semibold tracking-[.07em] uppercase text-ink-3 mb-2.5">Details</div>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="bg-bg rounded-[8px] p-2.5">
              <div className="text-[10px] text-ink-3 uppercase tracking-[.06em] font-semibold mb-[3px]">Category</div>
              <div className="text-[13px] font-medium text-ink-1">{expense.category}</div>
            </div>
            <div className="bg-bg rounded-[8px] p-2.5">
              <div className="text-[10px] text-ink-3 uppercase tracking-[.06em] font-semibold mb-[3px]">Processed Base</div>
              <div className="text-[13px] font-medium text-ink-1">{expense.companyCurrency}</div>
            </div>
            <div className="bg-bg rounded-[8px] p-2.5 mt-0.5">
              <div className="text-[10px] text-ink-3 uppercase tracking-[.06em] font-semibold mb-[3px]">Submitted By</div>
              <div className="text-[13px] font-medium text-ink-1 truncate" title={expense.submitter?.name}>
                {expense.submitter?.name}
              </div>
            </div>
            <div className="bg-bg rounded-[8px] p-2.5 mt-0.5">
              <div className="text-[10px] text-ink-3 uppercase tracking-[.06em] font-semibold mb-[3px]">Approvers</div>
              <div className="text-[13px] font-medium text-ink-1">{expense.approvalSteps?.length || 0} step(s)</div>
            </div>
          </div>

          {canAct && expense.status !== 'APPROVED' && expense.status !== 'REJECTED' && !expense.autoApprovedByRule && (
            <div className="mb-6 bg-surface border border-green-mid rounded-md1 p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-bg rounded-bl-full -z-10 opacity-50"></div>
              <div className="text-[10.5px] font-semibold tracking-[.07em] uppercase text-green-text mb-2.5">Your Action Required</div>
              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)..."
                className="input-field mb-3 min-h-[70px] resize-y text-[13px]"
              />
              <div className="flex gap-2">
                <button onClick={() => handleApprove('APPROVE')} className="flex-1 bg-green-text hover:bg-green-mid text-white font-medium py-2 rounded-sm1 flex items-center justify-center gap-1 text-[13px] transition-colors border-none shadow-sm">
                  <Check size={16} /> Approve
                </button>
                <button onClick={() => handleApprove('REJECT')} className="flex-1 bg-red-bg hover:bg-surface2 text-red-text font-medium py-2 rounded-sm1 flex items-center justify-center gap-1 text-[13px] transition-colors border border-red-text border-opacity-30">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          <div className="text-[10.5px] font-semibold tracking-[.07em] uppercase text-ink-3 mb-4">Approval Timeline</div>
          <div className="mb-6">
            {(!expense.approvalSteps || expense.approvalSteps.length === 0) ? (
              <p className="text-[13px] text-ink-3 italic">No approval steps generated.</p>
            ) : (
              <div className="space-y-0 text-ink-1 relative pr-2">
                {expense.approvalSteps.map((step, idx) => {
                  const s = step.status;
                  const dc = s === 'APPROVED' ? 'done' : s === 'REJECTED' ? 'rej' : s === 'PENDING' ? 'active' : 'next';
                  const sc = s === 'APPROVED' ? 'bg-green-mid' : 'bg-border2';
                  const ac = s === 'APPROVED' ? 'text-green-mid' : s === 'PENDING' ? 'text-amber-text' : s === 'REJECTED' ? 'text-red-text' : 'text-ink-3';
                  const al = s === 'APPROVED' ? `✓ Approved` : s === 'PENDING' ? '⏳ Awaiting review' : s === 'REJECTED' ? '✕ Rejected' : '— Not reached';

                  return (
                    <div key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {idx < expense.approvalSteps.length - 1 && (
                        <div className={`absolute left-[11.25px] top-[24px] w-[1.5px] bottom-0 ${s === 'APPROVED' ? 'bg-green-mid' : 'bg-border2'} z-0`}></div>
                      )}
                      
                      <div className={`tl-dot ${dc}`}>{getInitials(step.approver?.name)}</div>
                      
                      <div className="flex-1 pb-1">
                        <div className="text-[13px] font-medium leading-[1.3]">{step.approver?.name}</div>
                        <div className="text-[11px] text-ink-3">Step {step.sequence}</div>
                        <div className={`text-[11.5px] font-medium mt-1 ${ac}`}>{al}</div>
                        {step.comment && (
                          <div className="text-[12px] text-ink-2 mt-1.5 bg-bg rounded-[6px] p-2 pb-2.5 font-italic border-l-2 border-border2 italic leading-relaxed">
                            "{step.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {checkAutoApprovalBadge()}
          </div>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-ink-1/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex align-center justify-center">
             <img 
               src={expense.receiptImageUrl} 
               alt="Scanned Receipt" 
               className="max-w-full max-h-[90vh] object-contain rounded-md1 shadow-2xl" 
               onClick={(e) => e.stopPropagation()} 
             />
             <button 
               className="absolute -top-10 right-0 md:-top-6 md:-right-12 text-white/70 hover:text-white transition-colors bg-ink-1 rounded-full p-1"
               onClick={() => setLightboxOpen(false)}
             >
               <X size={28} />
             </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ExpenseDetail;
