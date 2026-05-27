import { useState, useEffect } from 'react';
import {
  collection, getDocs, doc, updateDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRole } from '../../components/admin/AdminGuard';
import { Navigate } from 'react-router-dom';
import { Shield, User, CheckCircle, XCircle, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import './UsersPage.css';

const FACULTIES = [
  'All Faculties',
  'Filmmaking and Video Production',
  'Multimedia Production',
  'Photography and Graphic Design',
  'Software Development',
];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   className: 'badge-pending', icon: Clock },
  active:   { label: 'Active',    className: 'badge-current', icon: CheckCircle },
  disabled: { label: 'Disabled',  className: 'badge-past',    icon: XCircle },
};

const ROLE_CONFIG = {
  trainer:    { label: 'Trainer',    color: '#93c5fd' },
  superadmin: { label: 'Superadmin', color: 'var(--white)' },
};

export default function UsersPage() {
  const { profile } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Only superadmin can access
  if (profile?.role !== 'superadmin') return <Navigate to="/admin/dashboard" replace />;

  const fetchUsers = async () => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const update = async (uid, changes) => {
    setUpdating(uid);
    await updateDoc(doc(db, 'users', uid), changes);
    setUsers((prev) => prev.map((u) => u.id === uid ? { ...u, ...changes } : u));
    setUpdating(null);
  };

  const handleApprove = (uid) => update(uid, { status: 'active' });
  const handleDisable = (uid) => update(uid, { status: 'disabled' });
  const handlePromote = (uid) => update(uid, { role: 'superadmin' });
  const handleDemote  = (uid) => update(uid, { role: 'trainer' });
  const handleFaculty = (uid, faculty) => update(uid, { faculty });

  const pending = users.filter((u) => u.status === 'pending');
  const active  = users.filter((u) => u.status === 'active');
  const disabled = users.filter((u) => u.status === 'disabled');

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Approve, promote, and assign trainers to their faculties</p>
      </div>

      {/* Pending approvals banner */}
      {pending.length > 0 && (
        <div className="pending-banner">
          <Clock size={16} />
          <span>
            <strong>{pending.length} account{pending.length !== 1 ? 's' : ''}</strong> waiting for approval
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="glass-card users-section">
              <h3 className="users-section-title">
                <Clock size={16} style={{ color: 'var(--warning)' }} /> Pending Approval
              </h3>
              <UserTable
                users={pending}
                updating={updating}
                onApprove={handleApprove}
                onDisable={handleDisable}
                onPromote={handlePromote}
                onDemote={handleDemote}
                onFaculty={handleFaculty}
              />
            </div>
          )}

          {/* Active */}
          <div className="glass-card users-section">
            <h3 className="users-section-title">
              <CheckCircle size={16} style={{ color: 'var(--success)' }} /> Active Users ({active.length})
            </h3>
            {active.length === 0 ? (
              <p style={{ color: 'var(--white-muted)', padding: '12px 0' }}>No active users yet.</p>
            ) : (
              <UserTable
                users={active}
                updating={updating}
                onApprove={handleApprove}
                onDisable={handleDisable}
                onPromote={handlePromote}
                onDemote={handleDemote}
                onFaculty={handleFaculty}
              />
            )}
          </div>

          {/* Disabled */}
          {disabled.length > 0 && (
            <div className="glass-card users-section">
              <h3 className="users-section-title">
                <XCircle size={16} style={{ color: 'var(--white-muted)' }} /> Disabled ({disabled.length})
              </h3>
              <UserTable
                users={disabled}
                updating={updating}
                onApprove={handleApprove}
                onDisable={handleDisable}
                onPromote={handlePromote}
                onDemote={handleDemote}
                onFaculty={handleFaculty}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserTable({ users, updating, onApprove, onDisable, onPromote, onDemote, onFaculty }) {
  return (
    <div className="table-wrapper" style={{ border: 'none' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Faculty</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const StatusIcon = STATUS_CONFIG[u.status]?.icon || Clock;
            const isUpdating = updating === u.id;
            return (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: 'var(--white)' }}>{u.name}</td>
                <td style={{ color: 'var(--white-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                <td>
                  <span style={{ color: ROLE_CONFIG[u.role]?.color || 'var(--white-muted)', fontWeight: 600, fontSize: '0.8rem' }}>
                    {u.role === 'superadmin' ? <Shield size={12} style={{ display: 'inline', marginRight: 4 }} /> : null}
                    {ROLE_CONFIG[u.role]?.label || u.role}
                  </span>
                </td>
                <td>
                  <select
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto', minWidth: 160 }}
                    value={u.faculty || ''}
                    onChange={(e) => onFaculty(u.id, e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="">Unassigned</option>
                    {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
                <td>
                  <span className={`badge ${STATUS_CONFIG[u.status]?.className || ''}`}>
                    <StatusIcon size={10} style={{ marginRight: 4 }} />
                    {STATUS_CONFIG[u.status]?.label || u.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {isUpdating && <span className="spinner" style={{ width: 16, height: 16 }} />}
                    {!isUpdating && u.status === 'pending' && (
                      <button className="btn btn-success btn-sm" onClick={() => onApprove(u.id)}>
                        <CheckCircle size={12} /> Approve
                      </button>
                    )}
                    {!isUpdating && u.status === 'active' && (
                      <button className="btn btn-danger btn-sm" onClick={() => onDisable(u.id)}>
                        <XCircle size={12} /> Disable
                      </button>
                    )}
                    {!isUpdating && u.status === 'disabled' && (
                      <button className="btn btn-success btn-sm" onClick={() => onApprove(u.id)}>
                        <CheckCircle size={12} /> Re-enable
                      </button>
                    )}
                    {!isUpdating && u.role === 'trainer' && u.status === 'active' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onPromote(u.id)}>
                        <ChevronUp size={12} /> Promote
                      </button>
                    )}
                    {!isUpdating && u.role === 'superadmin' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onDemote(u.id)}>
                        <ChevronDown size={12} /> Demote
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
