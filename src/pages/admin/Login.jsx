import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Eye, EyeOff, BookOpen, LogIn, Mail } from 'lucide-react';
import './Auth.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess('Password reset link sent! Check your inbox for instructions.');
      setResetEmail('');
    } catch (err) {
      setError(
        err.code === 'auth/user-not-found'
          ? 'No account found with this email address.'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address.'
          : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card glass-card animate-scale">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="auth-title">eKIZAMINI</h1>
            <p className="auth-subtitle">NAD Production — Admin Portal</p>
          </div>
        </div>

        <div className="auth-divider" />

        {isResetMode ? (
          <>
            <h2 className="auth-heading">Reset password</h2>
            <p className="auth-desc">Enter your email to receive a password reset link</p>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {success && <div className="alert alert-success" role="alert">{success}</div>}

            <form onSubmit={handleResetSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  name="resetEmail"
                  className="form-input"
                  placeholder="admin@nadproduction.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                id="reset-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : <Mail size={18} />}
                {loading ? 'Sending link…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="auth-link-text">
              Remembered your password?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                  setSuccess('');
                }}
              >
                Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="auth-heading">Welcome back</h2>
            <p className="auth-desc">Sign in to manage exams and submissions</p>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="admin@nadproduction.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setIsResetMode(true);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-wrapper">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-icon"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : <LogIn size={18} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="auth-link-text">
              Don't have an account?{' '}
              <Link to="/admin/signup" className="auth-link">Create account</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
