import { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Sidebar from './Sidebar';

// ── Role Context ─────────────────────────────────────────────
export const RoleContext = createContext(null);
export const useRole = () => useContext(RoleContext);

export default function AdminGuard() {
  const [user, setUser] = useState(undefined);   // undefined = loading auth
  const [profile, setProfile] = useState(undefined); // undefined = loading profile

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setProfile(null); }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    // Live-listen to user profile for role/status changes
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        // No profile doc = first superadmin (bootstrapped manually)
        setProfile({ role: 'superadmin', status: 'active' });
      }
    });
    return unsub;
  }, [user]);

  // ── Loading ───────────────────────────────────────────────
  if (user === undefined || profile === undefined) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--black)', flexDirection: 'column', gap: 12,
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--white-muted)', fontSize: '0.85rem' }}>Loading…</p>
      </div>
    );
  }

  // ── Not logged in ─────────────────────────────────────────
  if (!user) return <Navigate to="/admin/login" replace />;

  // ── Pending approval ──────────────────────────────────────
  if (profile?.status === 'pending') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--black)', padding: 24,
      }}>
        <div className="glass-card animate-scale" style={{
          maxWidth: 440, width: '100%', padding: 40,
          textAlign: 'center', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>⏳</div>
          <h2>Account Pending</h2>
          <p>Your account is awaiting activation by the Superadmin. Please check back later.</p>
          <button
            className="btn btn-secondary"
            onClick={() => { auth.signOut(); }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── Active admin or superadmin ────────────────────────────
  return (
    <RoleContext.Provider value={{ profile, user }}>
      <div className="admin-layout">
        <Sidebar user={user} profile={profile} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </RoleContext.Provider>
  );
}
