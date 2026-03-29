import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-[10vh] px-4 animate-in fade-in duration-500">
      <div className="mb-8 text-center">
        <span className="font-disp text-[28px] tracking-tight text-ink-1">
          expense<span className="italic text-green-text font-serif">flow</span>
        </span>
        <div className="text-[13.5px] text-ink-3 mt-1 tracking-wide uppercase">Workspace Authentication</div>
      </div>
      
      <div className="card p-[32px] w-full max-w-[400px]">
        <h2 className="font-disp text-[24px] font-light mb-6 text-center text-ink-1">Welcome Back</h2>
        
        {error && <div className="bg-red-bg border border-red-text/30 text-red-text p-3 rounded-sm1 mb-5 text-center text-[13px]">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} onChange={e => setEmail(e.target.value)} required 
              placeholder="you@company.com"
              disabled={loading}
            />
          </div>
          <div className="pb-2">
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-1.5">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} onChange={e => setPassword(e.target.value)} required 
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          <button type="submit" className="w-full btn-primary h-[44px] text-[14px]" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink-3">
          Don't have an account? <Link to="/signup" className="text-green-mid hover:text-green-text font-medium transition-colors">Create Workspace</Link>
        </p>
      </div>
      
    </div>
  );
}

export default Login;
