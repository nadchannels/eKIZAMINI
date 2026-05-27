import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, addDoc, updateDoc, collection, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import RichTextEditor from '../../components/admin/RichTextEditor';
import {
  Plus, Trash2, Save, Send, ChevronDown, ChevronUp,
  Link as LinkIcon, Clock, AlignLeft, CheckSquare, FileText
} from 'lucide-react';
import './ExamEditor.css';

const FACULTIES = [
  'All Faculties',
  'Filmmaking and Video Production',
  'Multimedia Production',
  'Photography and Graphic Design',
  'Software Development',
];

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice', icon: CheckSquare },
  { value: 'short', label: 'Short Answer', icon: AlignLeft },
  { value: 'long', label: 'Long Answer', icon: FileText },
];

const newQuestion = () => ({
  id: crypto.randomUUID(),
  type: 'short',
  text: '',
  marks: 10,
  options: ['', '', '', ''],
  correctOption: 0,
});

export default function ExamEditor() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(examId);

  const [exam, setExam] = useState({
    title: '',
    faculty: 'All Faculties',
    instructions: '',
    prepTime: 5,
    duration: 60,
    submissionLink: '',
    startDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 24 * 3600 * 1000).toISOString().slice(0, 16),
    questions: [newQuestion()],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    getDoc(doc(db, 'exams', examId)).then((snap) => {
      if (snap.exists()) setExam({ ...snap.data() });
      setLoading(false);
    });
  }, [examId, isEdit]);

  const update = (field, value) =>
    setExam((prev) => ({ ...prev, [field]: value }));

  const updateQ = (idx, field, value) =>
    setExam((prev) => {
      const questions = [...prev.questions];
      questions[idx] = { ...questions[idx], [field]: value };
      return { ...prev, questions };
    });

  const updateOption = (qIdx, optIdx, value) =>
    setExam((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];
      options[optIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });

  const addQuestion = () =>
    setExam((prev) => ({ ...prev, questions: [...prev.questions, newQuestion()] }));

  const removeQuestion = (idx) =>
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));

  const addOption = (qIdx) =>
    setExam((prev) => {
      const questions = [...prev.questions];
      questions[qIdx] = {
        ...questions[qIdx],
        options: [...questions[qIdx].options, ''],
      };
      return { ...prev, questions };
    });

  const removeOption = (qIdx, optIdx) =>
    setExam((prev) => {
      const questions = [...prev.questions];
      const options = questions[qIdx].options.filter((_, i) => i !== optIdx);
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });

  const handleSave = async (statusOverride) => {
    if (!exam.title.trim()) { setError('Exam title is required.'); return; }
    if (exam.questions.length === 0) { setError('Add at least one question.'); return; }
    setSaving(true); setError(''); setSuccess('');
    const payload = {
      ...exam,
      updatedAt: serverTimestamp(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'exams', examId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'exams'), payload);
      }
      setSuccess(statusOverride === 'current' ? 'Exam published!' : 'Exam saved!');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCollapse = (idx) =>
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  if (loading) return (
    <div className="flex justify-center" style={{ padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="exam-editor animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
          <p>Build your exam with rich formatting and multiple question types</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => handleSave()} disabled={saving}>
            {saving ? <span className="spinner" /> : <Save size={16} />}
            Save Exam
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      <div className="exam-editor-grid">
        {/* Main */}
        <div className="exam-editor-main">
          {/* Exam Details */}
          <div className="glass-card editor-section">
            <h3 className="section-title">Exam Details</h3>
            <div className="form-group">
              <label className="form-label">Exam Title *</label>
              <input
                className="form-input"
                placeholder="e.g. Mid-term Examination — Video Production"
                value={exam.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>
            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Faculty</label>
                <select
                  className="form-input"
                  value={exam.faculty}
                  onChange={(e) => update('faculty', e.target.value)}
                >
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={exam.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={exam.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Instructions (optional)</label>
              <RichTextEditor
                value={exam.instructions}
                onChange={(html) => update('instructions', html)}
                placeholder="Write exam instructions here…"
              />
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">
                <LinkIcon size={14} style={{ display: 'inline', marginRight: 6 }} />
                Submission Folder Link (optional)
              </label>
              <input
                className="form-input"
                type="url"
                placeholder="https://drive.google.com/…"
                value={exam.submissionLink}
                onChange={(e) => update('submissionLink', e.target.value)}
              />
              <small style={{ color: 'var(--white-muted)', fontSize: '0.8rem' }}>
                Google Drive, Dropbox, or any link where trainees upload files
              </small>
            </div>
          </div>

          {/* Questions */}
          <div className="glass-card editor-section">
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="section-title">Questions</h3>
              <button className="btn btn-secondary btn-sm" onClick={addQuestion}>
                <Plus size={14} /> Add Question
              </button>
            </div>

            {exam.questions.map((q, idx) => (
              <div key={q.id} className="question-block">
                <div className="question-header" onClick={() => toggleCollapse(idx)}>
                  <div className="question-number">Q{idx + 1}</div>
                  <div className="question-preview">
                    {q.text ? q.text.replace(/<[^>]+>/g, '').slice(0, 60) || `Question ${idx + 1}` : `Question ${idx + 1}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="q-type-badge">{QUESTION_TYPES.find((t) => t.value === q.type)?.label}</span>
                    <button
                      className="rte-btn"
                      onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                    {collapsed[idx] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </div>
                </div>

                {!collapsed[idx] && (
                  <div className="question-body">
                    {/* Type selector */}
                    <div className="q-type-selector">
                      {QUESTION_TYPES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          className={`q-type-btn${q.type === value ? ' active' : ''}`}
                          onClick={() => updateQ(idx, 'type', value)}
                        >
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <RichTextEditor
                        value={q.text}
                        onChange={(html) => updateQ(idx, 'text', html)}
                        placeholder={`Write question ${idx + 1} here…`}
                      />
                    </div>

                    {/* MCQ Options */}
                    {q.type === 'mcq' && (
                      <div className="form-group">
                        <label className="form-label">Answer Options</label>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="mcq-option">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctOption === oi}
                              onChange={() => updateQ(idx, 'correctOption', oi)}
                              title="Mark as correct answer"
                            />
                            <input
                              className="form-input"
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              value={opt}
                              onChange={(e) => updateOption(idx, oi, e.target.value)}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                className="rte-btn"
                                onClick={() => removeOption(idx, oi)}
                                style={{ color: 'var(--danger)', flexShrink: 0 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addOption(idx)}>
                          <Plus size={14} /> Add Option
                        </button>
                      </div>
                    )}

                    <div className="form-group" style={{ maxWidth: 160 }}>
                      <label className="form-label">Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="100"
                        value={q.marks}
                        onChange={(e) => updateQ(idx, 'marks', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button className="btn btn-secondary w-full" style={{ marginTop: 16 }} onClick={addQuestion}>
              <Plus size={16} /> Add Another Question
            </button>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="exam-editor-sidebar">
          <div className="glass-card editor-section">
            <h3 className="section-title">
              <Clock size={16} /> Timer Settings
            </h3>
            <div className="form-group">
              <label className="form-label">Preparation Time (minutes)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="60"
                value={exam.prepTime}
                onChange={(e) => update('prepTime', Number(e.target.value))}
              />
              <small style={{ color: 'var(--white-muted)', fontSize: '0.78rem' }}>
                Trainees read the exam before the timer starts
              </small>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Exam Duration (minutes)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="480"
                value={exam.duration}
                onChange={(e) => update('duration', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="glass-card editor-section">
            <h3 className="section-title">Summary</h3>
            <div className="summary-row">
              <span>Questions</span>
              <strong>{exam.questions.length}</strong>
            </div>
            <div className="summary-row">
              <span>Total Marks</span>
              <strong>{exam.questions.reduce((s, q) => s + (q.marks || 0), 0)}</strong>
            </div>
            <div className="summary-row">
              <span>Total Duration</span>
              <strong>{exam.prepTime + exam.duration} min</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
