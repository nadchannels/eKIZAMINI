import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, where, getDocs, orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  Clock, Play, CheckCircle, PlusCircle, TrendingUp, Edit2, Trash2
} from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import './Dashboard.css';

const FACULTIES = [
  'Filmmaking and Video Production',
  'Multimedia Production',
  'Photography and Graphic Design',
  'Software Development',
];

export default function Dashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const pending = exams.filter((e) => e.status === 'pending');
  const current = exams.filter((e) => e.status === 'current');
  const past = exams.filter((e) => e.status === 'past');

  const filtered = filter === 'all' ? exams : exams.filter((e) => e.status === filter);

  const handleDelete = async (examId) => {
    if (!window.confirm('Delete this exam? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'exams', examId));
    fetchExams();
  };

  // Compute average score per faculty from submissions
  const [avgByFaculty, setAvgByFaculty] = useState({});
  useEffect(() => {
    const fetchAvg = async () => {
      try {
        const snap = await getDocs(collection(db, 'submissions'));
        const byFaculty = {};
        snap.docs.forEach((d) => {
          const sub = d.data();
          const faculty = sub.trainee?.faculty || 'Unknown';
          if (!byFaculty[faculty]) byFaculty[faculty] = { total: 0, count: 0 };
          if (sub.totalScore != null) {
            byFaculty[faculty].total += sub.totalScore;
            byFaculty[faculty].count += 1;
          }
        });
        const avgs = {};
        Object.entries(byFaculty).forEach(([f, v]) => {
          avgs[f] = v.count ? Math.round(v.total / v.count) : null;
        });
        setAvgByFaculty(avgs);
      } catch {}
    };
    fetchAvg();
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your exam sessions and track performance</p>
        </div>
        <Link to="/admin/exam/new" className="btn btn-primary">
          <PlusCircle size={18} /> New Exam
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-xl">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Clock size={20} style={{ color: 'var(--warning)' }} />
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-value">{pending.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Play size={20} style={{ color: 'var(--success)' }} />
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-value">{current.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={20} style={{ color: 'var(--white-muted)' }} />
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-value">{past.length}</div>
        </div>
      </div>

      {/* Performance by Faculty */}
      <div className="glass-card mb-xl" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={20} /> Average Performance by Faculty
        </h3>
        <div className="grid-2">
          {FACULTIES.map((fac) => {
            const avg = avgByFaculty[fac];
            const pct = avg != null ? Math.min(avg, 100) : 0;
            return (
              <div key={fac} className="faculty-perf-item">
                <div className="faculty-perf-label">
                  <span>{fac}</span>
                  <span className="faculty-perf-score">
                    {avg != null ? `${avg}%` : 'No data'}
                  </span>
                </div>
                <div className="faculty-perf-bar">
                  <div
                    className="faculty-perf-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam List */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div className="flex justify-between items-center mb-lg">
          <h3>Exams</h3>
          <div className="filter-tabs">
            {['all', 'pending', 'current', 'past'].map((f) => (
              <button
                key={f}
                className={`filter-tab${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center" style={{ padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No exams found. <Link to="/admin/exam/new" className="auth-link">Create one</Link></p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Faculty</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam) => (
                  <tr key={exam.id}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{exam.title}</td>
                    <td>{exam.faculty || 'All'}</td>
                    <td>{exam.duration} min</td>
                    <td>
                      <span className={`badge badge-${exam.status}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(exam.status === 'pending' || exam.status === 'current') && (
                          <Link
                            to={`/admin/exam/edit/${exam.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <Edit2 size={14} /> Edit
                          </Link>
                        )}
                        <Link
                          to={`/admin/marks/${exam.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Marks
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(exam.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
