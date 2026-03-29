import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, CheckCircle, Plus, Trash2 } from 'lucide-react';
import api from '../api';

function AdminUsers({ user }) {
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', managerId: '', isManagerApprover: false });
  const [ruleForm, setRuleForm] = useState({ name: '', ruleType: 'PERCENTAGE', percentageThreshold: '', specificApproverId: '' });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = () => api.get('/users').then(res => setUsers(res.data)).catch(console.error);
  const fetchRules = () => api.get('/rules').then(res => setRules(res.data)).catch(console.error);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
    } else {
      fetchUsers();
      fetchRules();
    }
  }, [user, navigate]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', userForm);
      setShowAddUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'EMPLOYEE', managerId: '', isManagerApprover: false });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/rules', ruleForm);
      setShowAddRule(false);
      setRuleForm({ name: '', ruleType: 'PERCENTAGE', percentageThreshold: '', specificApproverId: '' });
      fetchRules();
    } catch (err) {
       alert(err.response?.data?.error || 'Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setUserForm({ ...userForm, [e.target.name]: value });
  };

  const handleRuleChange = (e) => {
    setRuleForm({ ...ruleForm, [e.target.name]: e.target.value });
  };

  const handleUpdateRole = async (id, newRole) => {
    try { await api.patch(`/users/${id}`, { role: newRole }); fetchUsers(); } catch (err) {}
  };
  const handleUpdateManager = async (id, newManagerId) => {
    try { await api.patch(`/users/${id}`, { managerId: newManagerId === '' ? null : newManagerId }); fetchUsers(); } catch (err) {}
  };
  const handleToggleApprover = async (id, currentVal) => {
    try { await api.patch(`/users/${id}`, { isManagerApprover: !currentVal }); fetchUsers(); } catch (err) {}
  };

  const handleToggleRule = async (id, currentVal) => {
    try { await api.patch(`/rules/${id}`, { isActive: !currentVal }); fetchRules(); } catch (err) {}
  };
  const handleDeleteRule = async (id) => {
    try { await api.delete(`/rules/${id}`); fetchRules(); } catch(err) {}
  };

  const getInitials = (n) => n ? n.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'U';

  return (
    <div className="max-w-5xl mx-auto pt-2 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row gap-4 border-b border-border1 pb-6 mb-6">
        <div>
          <div className="font-disp text-[26px] font-light tracking-tight text-ink-1 leading-tight flex items-center gap-2.5">
            <Shield size={24} className="text-amber-text" /> Admin Settings
          </div>
          <div className="text-ink-3 text-[13px] mt-1.5">Manage workforce hierarchy and conditional approval rules.</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-border1 pb-1">
        <button onClick={() => setActiveTab('users')} className={`text-[13.5px] font-semibold tracking-wide uppercase px-2 pb-2 border-b-[2px] transition-colors ${activeTab === 'users' ? 'text-green-text border-green-mid' : 'text-ink-3 border-transparent hover:text-ink-2'}`}>
          Workforce & Users
        </button>
        <button onClick={() => setActiveTab('rules')} className={`text-[13.5px] font-semibold tracking-wide uppercase px-2 pb-2 border-b-[2px] transition-colors ${activeTab === 'rules' ? 'text-green-text border-green-mid' : 'text-ink-3 border-transparent hover:text-ink-2'}`}>
          Approval Rules
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowAddUser(!showAddUser)} className={`flex items-center gap-1.5 px-4 py-2 ${showAddUser ? 'btn-ghost' : 'btn-primary'} text-[13px] font-medium transition-colors`}>
              <UserPlus size={16} /> {showAddUser ? 'Cancel Adding' : 'Add Employee'}
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleUserSubmit} className="card p-6 border-green-mid/30 bg-green-bg/30">
              <div className="text-[14px] font-medium text-ink-1 mb-5">Create New User</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4 items-end">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Full Name</label>
                  <input name="name" className="input-field py-2" value={userForm.name} onChange={handleUserChange} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Email</label>
                  <input type="email" name="email" className="input-field py-2" value={userForm.email} onChange={handleUserChange} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Temp Password</label>
                  <input type="password" name="password" className="input-field py-2" value={userForm.password} onChange={handleUserChange} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Role</label>
                  <select name="role" className="input-field py-2" value={userForm.role} onChange={handleUserChange} disabled={loading}>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Manager Setup</label>
                  <select name="managerId" className="input-field py-2" value={userForm.managerId} onChange={handleUserChange} disabled={loading}>
                    <option value="">None</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 bg-surface border border-border1 rounded-[8px] h-[39px] px-3">
                  <input type="checkbox" name="isManagerApprover" id="isManagerApprover" className="w-[15px] h-[15px] accent-green-text rounded border-border1" checked={userForm.isManagerApprover} onChange={handleUserChange} disabled={loading} />
                  <label htmlFor="isManagerApprover" className="text-[12px] font-medium text-ink-2 select-none cursor-pointer">Can Approve Subordinates</label>
                </div>
                <div className="md:col-span-2 lg:col-span-3 pt-3 border-t border-border1 mt-1">
                  <button type="submit" className="w-full btn-primary" disabled={loading}>
                    <CheckCircle size={16} /> Save New Employee
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="card w-full overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-border1 bg-bg">
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Team Member</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Role Setup</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Manager Chain</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Approval Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border1">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-surface2 transition-colors">
                    <td className="p-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-[32px] h-[32px] rounded-full bg-surface text-ink-2 text-[10px] font-semibold flex items-center justify-center border border-border2">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-ink-1 text-[13.5px]">{u.name} {u.id === user.id ? <span className="text-green-mid ml-1 font-normal text-[11px]">(You)</span> : ''}</div>
                          <div className="text-[12px] text-ink-3">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-middle">
                      <select value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} disabled={u.id === user.id} className="bg-bg border border-border2 rounded-[6px] py-1.5 px-2 text-[12.5px] text-ink-2 outline-none w-32 cursor-pointer disabled:opacity-50 hover:border-green-mid">
                        <option value="EMPLOYEE">EMPLOYEE</option><option value="MANAGER">MANAGER</option><option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-5 align-middle">
                      <select value={u.managerId || ''} onChange={(e) => handleUpdateManager(u.id, e.target.value)} disabled={u.id === user.id} className="bg-bg border border-border2 rounded-[6px] py-1.5 px-2 text-[12.5px] text-ink-2 outline-none w-48 cursor-pointer disabled:opacity-50 hover:border-green-mid">
                        <option value="">-- No Direct Line --</option>
                        {users.filter(other => other.id !== u.id).map(other => <option key={other.id} value={other.id}>{other.name}</option>)}
                      </select>
                    </td>
                    <td className="p-5 align-middle">
                      <button onClick={() => handleToggleApprover(u.id, u.isManagerApprover)} disabled={u.id === user.id && u.role === 'ADMIN'} className={`pill ${u.isManagerApprover ? 'pill-approved cursor-pointer hover:bg-green-mid hover:text-white' : 'pill-draft cursor-pointer border border-border2 hover:bg-surface'} disabled:opacity-50`}>
                        {u.isManagerApprover ? <><span className="pill-dot"></span>Approver Active</> : 'No Approval Privileges'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowAddRule(!showAddRule)} className={`flex items-center gap-1.5 px-4 py-2 ${showAddRule ? 'btn-ghost' : 'btn-primary'} text-[13px] font-medium transition-colors`}>
              <Plus size={16} /> {showAddRule ? 'Cancel' : 'Add Rule'}
            </button>
          </div>

          {showAddRule && (
            <form onSubmit={handleRuleSubmit} className="card p-6 border-amber-text/30 bg-amber-bg/30">
              <div className="text-[14px] font-medium text-ink-1 mb-5">Create Conditional Approval Rule</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Rule Name</label>
                  <input name="name" className="input-field py-2" value={ruleForm.name} onChange={handleRuleChange} required disabled={loading} placeholder="e.g. CFO Immediate Bypass" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Condition Type</label>
                  <select name="ruleType" className="input-field py-2" value={ruleForm.ruleType} onChange={handleRuleChange} disabled={loading}>
                    <option value="PERCENTAGE">Percentage Match</option>
                    <option value="SPECIFIC_APPROVER">Specific Key Approver</option>
                    <option value="HYBRID">Hybrid (Percent OR Approver)</option>
                  </select>
                </div>
                
                {(ruleForm.ruleType === 'PERCENTAGE' || ruleForm.ruleType === 'HYBRID') && (
                  <div className="lg:col-span-2">
                    <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Threshold (%)</label>
                    <input type="number" min="1" max="100" name="percentageThreshold" className="input-field py-2" value={ruleForm.percentageThreshold} onChange={handleRuleChange} required disabled={loading} placeholder="e.g. 50" />
                  </div>
                )}

                {(ruleForm.ruleType === 'SPECIFIC_APPROVER' || ruleForm.ruleType === 'HYBRID') && (
                  <div className="lg:col-span-2">
                    <label className="block text-[10.5px] font-semibold tracking-[.06em] uppercase text-ink-3 mb-1.5">Key Approver</label>
                    <select name="specificApproverId" className="input-field py-2" value={ruleForm.specificApproverId} onChange={handleRuleChange} required disabled={loading}>
                      <option value="">Select an approver...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-border1 mt-1">
                  <button type="submit" className="w-full btn-primary !bg-amber-text hover:!bg-amber-700 text-white" disabled={loading}>
                    <CheckCircle size={16} /> Save Rule
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="card w-full overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-border1 bg-bg">
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Rule Name</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Type</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Parameters</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-left border-b border-border1">Status</th>
                  <th className="text-[10.5px] font-semibold tracking-wider uppercase text-ink-3 py-[12px] px-5 text-center border-b border-border1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border1">
                {rules.map(r => (
                  <tr key={r.id} className={`transition-colors ${!r.isActive ? 'opacity-60 bg-bg' : 'hover:bg-surface2'}`}>
                    <td className="p-5 align-middle">
                      <div className="font-semibold text-ink-1 text-[13.5px]">{r.name}</div>
                    </td>
                    <td className="p-5 align-middle">
                      <span className="pill pill-draft text-[10px]">{r.ruleType.replace('_', ' ')}</span>
                    </td>
                    <td className="p-5 align-middle text-[12.5px] text-ink-2">
                       {r.percentageThreshold ? `${r.percentageThreshold}% Threshold` : ''} 
                       {r.percentageThreshold && r.specificApprover ? ' OR ' : ''}
                       {r.specificApprover ? `Key Approver: ${r.specificApprover.name}` : ''}
                    </td>
                    <td className="p-5 align-middle">
                       <label className="flex items-center cursor-pointer relative">
                         <input type="checkbox" className="sr-only" checked={r.isActive} onChange={() => handleToggleRule(r.id, r.isActive)} />
                         <div className={`w-9 h-5 rounded-full shadow-inner transition-colors ${r.isActive ? 'bg-green-mid' : 'bg-border2'}`}></div>
                         <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${r.isActive ? 'transform translate-x-4' : ''}`}></div>
                       </label>
                    </td>
                    <td className="p-5 align-middle text-center">
                       <button onClick={() => handleDeleteRule(r.id)} className="text-red-text/70 hover:text-red-text transition-colors p-2 bg-red-bg rounded-md1">
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                   <tr><td colSpan="5" className="p-8 text-center text-[13px] text-ink-3 italic">No approval rules configured yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminUsers;
