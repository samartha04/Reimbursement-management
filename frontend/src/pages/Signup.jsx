import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Signup({ setUser }) {
  const [formData, setFormData] = useState({ companyName: '', userName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', formData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="flex flex-col items-center justify-center pt-[8vh] px-4 animate-in fade-in duration-500">
      <div className="mb-8 text-center">
        <span className="font-disp text-[28px] tracking-tight text-ink-1">
          expense<span className="italic text-green-text font-serif">flow</span>
        </span>
        <div className="text-[13.5px] text-ink-3 mt-1 tracking-wide uppercase">Workspace Onboarding</div>
      </div>

      <div className="card p-[32px] w-full max-w-[440px]">
        <h2 className="font-disp text-[24px] font-light mb-2 text-center text-ink-1">Create Account</h2>
        <p className="text-ink-3 text-[13px] text-center mb-6">Initialize a new secure corporate portal.</p>
        
        {error && <div className="bg-red-bg border border-red-text/30 text-red-text p-3 rounded-sm1 mb-5 text-center text-[13px]">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Company Label</label>
            <input name="companyName" className="input-field" onChange={handleChange} required disabled={loading} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Your Full Name</label>
            <input name="userName" className="input-field" onChange={handleChange} required disabled={loading} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Work Email</label>
            <input type="email" name="email" className="input-field" onChange={handleChange} required disabled={loading} placeholder="you@company.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Password</label>
            <input type="password" name="password" className="input-field" onChange={handleChange} required disabled={loading} placeholder="••••••••" />
          </div>
          <div className="pb-2">
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Base Currency</label>
            <input type="text" value="INR (Fixed)" disabled className="input-field bg-surface2 text-ink-3 cursor-not-allowed" />
          </div>
          
          <button type="submit" className="w-full btn-primary h-[44px] text-[14px]" disabled={loading}>
            {loading ? 'Bootstrapping Network...' : 'Launch Workspace'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-[13px] text-ink-3">
          Already using Expenseflow? <Link to="/login" className="text-green-mid hover:text-green-text font-medium transition-colors">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
