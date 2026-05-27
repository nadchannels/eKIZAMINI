import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  LayoutDashboard, FileText, ClipboardCheck,
  PlusCircle, LogOut, BookOpen, Users, Shield
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ user, profile }) {
  const navigate = useNavigate();
  const isSuperAdmin = profile?.role === 'superadmin';

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/exam/new', icon: PlusCircle, label: 'New Exam' },
    { to: '/admin/marks', icon: ClipboardCheck, label: 'Marks' },
    ...(isSuperAdmin ? [{ to: '/admin/users', icon: Users, label: 'Users' }] : []),
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BookOpen size={22} />
        </div>
        <div>
          <div className="sidebar-brand">eKIZAMINI</div>
          <div className="sidebar-sub">NAD Production</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Role badge */}
      {isSuperAdmin && (
        <div className="sidebar-role-badge">
          <Shield size={12} /> Superadmin
        </div>
      )}
      {profile?.role === 'trainer' && profile?.faculty && (
        <div className="sidebar-role-badge sidebar-role-trainer">
          {profile.faculty}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.displayName || profile?.name || 'Admin'}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
