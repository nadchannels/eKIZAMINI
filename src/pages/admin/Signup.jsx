import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Eye, EyeOff, BookOpen, UserPlus, Clock } from 'lucide-react';
import './Auth.css';

const FACULTIES = [
  'Filmmaking and Video Production',
  'Multimedia Production',
  'Photography and Graphic Design',
  'Software Development',
];

export default function AdminSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', faculty: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(user, { displayName: form.name });
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        role: 'trainer',      // All new signups are trainers
        status: 'pending',    // Superadmin must approve
        faculty: form.faculty || null,
        createdAt: serverTimestamp(),
      });
      setPending(true);
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
        err.code === 'auth/weak-password' ? 'Password is too weak. Use at least 6 characters.' :
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Pending Approval Screen ───────────────────────────────
  if (pending) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>
        <div className="auth-card glass-card animate-scale" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--warning)', marginBottom: 8,
          }}>
            <Clock size={32} />
          </div>
          <h2 className="auth-heading">Account Pending</h2>
          <p className="auth-desc">
            Your account has been created and is awaiting approval from the Superadmin.
            You will receive access once your account is activated.
          </p>
          <div style={{
            padding: '14px 20px', background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', color: 'var(--white-muted)', width: '100%',
          }}>
            <strong style={{ color: 'var(--white)' }}>{form.name}</strong><br />
            {form.email}<br />
            {form.faculty && <span>Faculty: {form.faculty}</span>}
          </div>
          <Link to="/admin/login" className="btn btn-secondary w-full">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card glass-card animate-scale">
        <div className="auth-brand">
          <div className="auth-logo"><BookOpen size={24} /></div>
          <div>
            <h1 className="auth-title">eKIZAMINI</h1>
            <p className="auth-subtitle">NAD Production — Admin Portal</p>
          </div>
        </div>

        <div className="auth-divider" />

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-desc">Register as a trainer. A Superadmin will activate your account.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input id="signup-name" type="text" name="name" className="form-input"
              placeholder="Your full name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input id="signup-email" type="email" name="email" className="form-input"
              placeholder="trainer@nadproduction.com" value={form.email} onChange={handleChange}
              required autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-faculty">Assigned Faculty</label>
            <select id="signup-faculty" name="faculty" className="form-input"
              value={form.faculty} onChange={handleChange}>
              <option value="">-- Select your faculty --</option>
              {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div className="input-wrapper">
              <input id="signup-password" type={showPass ? 'text' : 'password'} name="password"
                className="form-input" placeholder="At least 6 characters" value={form.password}
                onChange={handleChange} required autoComplete="new-password" />
              <button type="button" className="input-icon" onClick={() => setShowPass((p) => !p)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
            <div className="input-wrapper">
              <input id="signup-confirm" type={showConfirm ? 'text' : 'password'} name="confirm"
                className="form-input" placeholder="Re-enter password" value={form.confirm}
                onChange={handleChange} required autoComplete="new-password" />
              <button type="button" className="input-icon" onClick={() => setShowConfirm((p) => !p)}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="signup-submit" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <UserPlus size={18} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-link-text">
          Already have an account?{' '}
          <Link to="/admin/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
