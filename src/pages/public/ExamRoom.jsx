import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BookOpen, Clock, Send, AlertTriangle, ExternalLink, Check } from 'lucide-react';
import './ExamRoom.css';

function CountdownTimer({ seconds, label, onEnd, urgent }) {
  const [remaining, setRemaining] = useState(seconds);
  const endFired = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    endFired.current = false;
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!endFired.current) { endFired.current = true; onEnd?.(); }
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onEnd]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const fmt = (n) => String(n).padStart(2, '0');
  const isUrgent = urgent && remaining <= 300;

  return (
    <div className={`countdown${isUrgent ? ' urgent' : ''}`}>
      <div className="countdown-label">{label}</div>
      <div className="countdown-time">
        {h > 0 && <><span>{fmt(h)}</span><span className="colon">:</span></>}
        <span>{fmt(m)}</span>
        <span className="colon">:</span>
        <span>{fmt(s)}</span>
      </div>
    </div>
  );
}

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | prep | exam | submitted
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Trainee from session
  const trainee = JSON.parse(sessionStorage.getItem('ek_trainee') || '{}');
  const partnerRaw = sessionStorage.getItem('ek_partner');
  const partner = partnerRaw ? JSON.parse(partnerRaw) : null;

  useEffect(() => {
    if (!trainee?.name) { navigate('/'); return; }
    getDoc(doc(db, 'exams', examId)).then((snap) => {
      if (!snap.exists()) { navigate('/'); return; }
      const data = { id: snap.id, ...snap.data() };
      setExam(data);
      setPhase(data.prepTime > 0 ? 'prep' : 'exam');
    });
  }, [examId]);

  const startExam = useCallback(() => setPhase('exam'), []);

  const handleAnswer = (qId, value) =>
    setAnswers((prev) => ({ ...prev, [qId]: value }));

  const handleSubmit = useCallback(async (isAuto = false) => {
    if (!isAuto && !window.confirm('Submit your exam? This cannot be undone.')) return;
    setSubmitting(true);
    setError('');
    try {
      const processedAnswers = (exam?.questions || []).map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));

      await addDoc(collection(db, 'submissions'), {
        examId,
        trainee,
        partner: partner?.name ? partner : null,
        answers: processedAnswers,
        marks: [],
        totalScore: null,
        submittedAt: serverTimestamp(),
      });

      setPhase('submitted');
    } catch (err) {
      console.error(err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [exam, answers, examId, trainee, partner]);

  const autoSubmit = useCallback(() => {
    if (phase === 'exam') handleSubmit(true);
  }, [phase, handleSubmit]);

  if (phase === 'loading' || !exam) {
    return (
      <div className="exam-room-loading">
        <div className="spinner" />
        <p>Loading exam…</p>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="exam-room exam-submitted animate-scale">
        <div className="submitted-card glass-card">
          <div className="submitted-icon"><Check size={40} /></div>
          <h1>Exam Submitted!</h1>
          <p>Your answers have been recorded successfully. Good luck with your results!</p>
          <div className="submitted-info">
            <div><strong>Name:</strong> {trainee.name}</div>
            {partner?.name && <div><strong>Partner:</strong> {partner.name}</div>}
            <div><strong>Reg Number:</strong> {trainee.regNumber}</div>
            <div><strong>Faculty:</strong> {trainee.faculty}</div>
          </div>
          {exam.submissionLink && (
            <div className="submitted-drive-link">
              <AlertTriangle size={16} />
              <div>
                <strong>Don't forget to submit your files!</strong>
                <p>Upload your work to the submission folder:</p>
                <a href={exam.submissionLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
                  <ExternalLink size={14} /> Open Submission Folder
                </a>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/')}>← Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-room">
      {/* Top Bar */}
      <div className="exam-topbar">
        <div className="exam-topbar-left">
          <div className="exam-logo"><BookOpen size={18} /></div>
          <div>
            <div className="exam-title">{exam.title}</div>
            <div className="exam-trainee">
              {trainee.name}{partner?.name ? ` & ${partner.name}` : ''}
            </div>
          </div>
        </div>
        <div className="exam-topbar-right">
          {phase === 'prep' && (
            <CountdownTimer
              seconds={exam.prepTime * 60}
              label="Preparation"
              onEnd={startExam}
            />
          )}
          {phase === 'exam' && (
            <CountdownTimer
              seconds={exam.duration * 60}
              label="Time Remaining"
              onEnd={autoSubmit}
              urgent
            />
          )}
        </div>
      </div>

      {/* Phase Banner */}
      {phase === 'prep' && (
        <div className="phase-banner prep-banner">
          <Clock size={16} />
          <span>
            <strong>Preparation Phase</strong> — Read the exam carefully. You cannot answer or submit during this phase.
          </span>
          <button className="btn btn-primary btn-sm" onClick={startExam}>
            Start Now
          </button>
        </div>
      )}

      {/* Exam Body */}
      <div className="exam-body">
        <div className="exam-container">
          {/* Instructions */}
          {exam.instructions && (
            <div className="exam-instructions glass-card">
              <h3>Instructions</h3>
              <div
                className="instructions-content"
                dangerouslySetInnerHTML={{ __html: exam.instructions }}
              />
            </div>
          )}

          {/* Submission Folder Link */}
          {exam.submissionLink && (
            <div className="submission-link-banner glass-card">
              <AlertTriangle size={16} />
              <div>
                <strong>File Submission Required</strong>
                <p>
                  After completing, upload your files to the examiner's submission folder:{' '}
                  <a href={exam.submissionLink} target="_blank" rel="noopener noreferrer" className="sub-link">
                    Open Folder <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          {exam.questions?.map((q, idx) => (
            <div key={q.id} className={`question-card glass-card${phase === 'prep' ? ' question-prep' : ''}`}>
              <div className="q-header">
                <div className="q-num">{idx + 1}</div>
                <div
                  className="q-text"
                  dangerouslySetInnerHTML={{ __html: q.text || `Question ${idx + 1}` }}
                />
                <div className="q-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</div>
              </div>

              {/* Answers — only during exam phase */}
              {phase === 'exam' && (
                <div className="q-answer-area">
                  {/* MCQ */}
                  {q.type === 'mcq' && (
                    <div className="mcq-options">
                      {q.options?.map((opt, oi) => (
                        <label key={oi} className={`mcq-opt${answers[q.id] === String(oi) ? ' selected' : ''}`}>
                          <input
                            type="radio"
                            name={`mcq-${q.id}`}
                            value={String(oi)}
                            checked={answers[q.id] === String(oi)}
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                          />
                          <span className="mcq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Short Answer */}
                  {q.type === 'short' && (
                    <input
                      className="form-input"
                      placeholder="Type your answer…"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                    />
                  )}

                  {/* Long Answer */}
                  {q.type === 'long' && (
                    <textarea
                      className="form-input long-answer"
                      placeholder="Type your detailed answer…"
                      rows={6}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Prep phase — read only overlay */}
              {phase === 'prep' && (
                <div className="prep-overlay">
                  <Clock size={16} />
                  <span>Answer fields will appear when the exam starts</span>
                </div>
              )}
            </div>
          ))}

          {/* Submit */}
          {phase === 'exam' && (
            <div className="exam-submit-bar">
              {error && <div className="alert alert-error">{error}</div>}
              <button
                id="submit-exam"
                className="btn btn-primary btn-lg"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? <span className="spinner" /> : <Send size={18} />}
                {submitting ? 'Submitting…' : 'Submit Exam'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
