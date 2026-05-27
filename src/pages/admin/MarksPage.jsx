import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection, query, where, getDocs, doc, updateDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import SubmissionViewer from '../../components/admin/SubmissionViewer';
import * as XLSX from 'xlsx';
import { Download, ChevronLeft, Eye, CheckCircle } from 'lucide-react';
import './MarksPage.css';

export default function MarksPage() {
  const { examId } = useParams();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(examId || '');
  const [selectedSub, setSelectedSub] = useState(null);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load all exams for the selector
  useEffect(() => {
    getDocs(collection(db, 'exams')).then((snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load submissions when exam changes
  useEffect(() => {
    if (!selectedExam) return;
    setLoading(true);
    setSelectedSub(null);
    const q = query(collection(db, 'submissions'), where('examId', '==', selectedExam));
    getDocs(q).then((snap) => {
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    getDoc(doc(db, 'exams', selectedExam)).then((snap) => {
      if (snap.exists()) setExamData({ id: snap.id, ...snap.data() });
    });
  }, [selectedExam]);

  const handleSaveMark = async (subId, marks, totalScore) => {
    await updateDoc(doc(db, 'submissions', subId), {
      marks,
      totalScore,
      markedAt: new Date(),
    });
    setSubmissions((prev) =>
      prev.map((s) => s.id === subId ? { ...s, marks, totalScore } : s)
    );
  };

  const handleExportExcel = () => {
    const rows = submissions.map((s) => ({
      Name: s.trainee?.name || '',
      'Partner Name': s.partner?.name || '',
      Faculty: s.trainee?.faculty || '',
      'Reg Number': s.trainee?.regNumber || '',
      'Partner Reg Number': s.partner?.regNumber || '',
      'Total Score': s.totalScore ?? 'Not marked',
      'Submitted At': s.submittedAt?.toDate?.()?.toLocaleString() || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `${examData?.title || 'exam'}_results.xlsx`);
  };

  if (selectedSub) {
    return (
      <div className="animate-fade">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 24 }} onClick={() => setSelectedSub(null)}>
          <ChevronLeft size={16} /> Back to submissions
        </button>
        <SubmissionViewer
          submission={selectedSub}
          exam={examData}
          onSave={(marks, total) => handleSaveMark(selectedSub.id, marks, total)}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Marks</h1>
          <p>Review submissions and assign scores</p>
        </div>
        {submissions.length > 0 && (
          <button className="btn btn-primary" onClick={handleExportExcel}>
            <Download size={16} /> Export Excel
          </button>
        )}
      </div>

      {/* Exam Selector */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="form-group">
          <label className="form-label">Select Exam</label>
          <select
            className="form-input"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="">-- Choose an exam --</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedExam && (
        <div className="empty-state glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <p>Select an exam to view submissions</p>
        </div>
      )}

      {selectedExam && loading && (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner" />
        </div>
      )}

      {selectedExam && !loading && submissions.length === 0 && (
        <div className="empty-state glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <p>No submissions yet for this exam.</p>
        </div>
      )}

      {selectedExam && !loading && submissions.length > 0 && (
        <div className="glass-card">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <strong>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</strong>
            {examData && <span style={{ color: 'var(--white-muted)', marginLeft: 8 }}>— {examData.title}</span>}
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Partner</th>
                  <th>Faculty</th>
                  <th>Reg Number</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{sub.trainee?.name}</td>
                    <td>{sub.partner?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{sub.trainee?.faculty}</td>
                    <td>{sub.trainee?.regNumber}</td>
                    <td>
                      {sub.totalScore != null ? (
                        <span style={{ fontWeight: 700, color: 'var(--white)' }}>
                          {sub.totalScore} / {examData?.questions?.reduce((s, q) => s + (q.marks || 0), 0) || '—'}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {sub.totalScore != null ? (
                        <span className="badge badge-current">
                          <CheckCircle size={12} style={{ marginRight: 4 }} /> Marked
                        </span>
                      ) : (
                        <span className="badge badge-pending">Pending</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedSub(sub)}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
