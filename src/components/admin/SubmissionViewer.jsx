import { useState } from 'react';
import { Save, ExternalLink, Image, Video, FileText } from 'lucide-react';
import './SubmissionViewer.css';

export default function SubmissionViewer({ submission, exam, onSave }) {
  const questions = exam?.questions || [];
  const [scores, setScores] = useState(() => {
    const init = {};
    (submission.marks || []).forEach((m) => { init[m.questionId] = m.score; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateScore = (qId, val) =>
    setScores((prev) => ({ ...prev, [qId]: val }));

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const totalScore = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    const marks = Object.entries(scores).map(([questionId, score]) => ({
      questionId,
      score: Number(score) || 0,
    }));
    await onSave(marks, totalScore);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAnswer = (qId) =>
    (submission.answers || []).find((a) => a.questionId === qId);

  const renderAnswer = (answer, question) => {
    if (!answer) return <span style={{ color: 'var(--white-muted)', fontStyle: 'italic' }}>No answer provided</span>;
    if (answer.fileUrl) {
      const url = answer.fileUrl;
      const ext = url.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return (
          <div>
            <img src={url} alt="Submission" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid var(--glass-border)' }} />
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
              <ExternalLink size={12} /> Open full image
            </a>
          </div>
        );
      }
      if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
        return (
          <div>
            <video controls style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <source src={url} />
            </video>
          </div>
        );
      }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <ExternalLink size={12} /> Open submission
        </a>
      );
    }
    if (question?.type === 'mcq') {
      const optIdx = Number(answer.answer);
      const optLabel = String.fromCharCode(65 + optIdx);
      const optText = question.options?.[optIdx] || answer.answer;
      const isCorrect = optIdx === question.correctOption;
      return (
        <div className={`mcq-answer ${isCorrect ? 'correct' : 'incorrect'}`}>
          <strong>{optLabel}.</strong> {optText}
          <span className="mcq-result">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
        </div>
      );
    }
    return (
      <div className="text-answer" dangerouslySetInnerHTML={{ __html: answer.answer || '' }} />
    );
  };

  return (
    <div className="submission-viewer animate-fade">
      {/* Header */}
      <div className="sv-header glass-card">
        <div>
          <h2>{exam?.title || 'Submission'}</h2>
          <div className="sv-meta">
            <span><strong>Trainee:</strong> {submission.trainee?.name}</span>
            <span><strong>Faculty:</strong> {submission.trainee?.faculty}</span>
            <span><strong>Reg:</strong> {submission.trainee?.regNumber}</span>
            {submission.partner?.name && (
              <>
                <span>|</span>
                <span><strong>Partner:</strong> {submission.partner.name}</span>
                <span><strong>Reg:</strong> {submission.partner.regNumber}</span>
              </>
            )}
          </div>
        </div>
        <div className="sv-score-box">
          <div className="sv-score">{totalScore} / {totalMarks}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--white-muted)' }}>Total Score</div>
        </div>
      </div>

      {/* Questions + Answers */}
      <div className="sv-questions">
        {questions.map((q, idx) => {
          const answer = getAnswer(q.id);
          const maxMark = q.marks || 0;
          return (
            <div key={q.id} className="sv-question glass-card">
              <div className="sv-q-header">
                <div className="question-number">Q{idx + 1}</div>
                <div
                  className="sv-q-text"
                  dangerouslySetInnerHTML={{ __html: q.text || `Question ${idx + 1}` }}
                />
                <div className="sv-mark-input">
                  <input
                    type="number"
                    min="0"
                    max={maxMark}
                    className="form-input"
                    style={{ width: 70, textAlign: 'center' }}
                    value={scores[q.id] ?? ''}
                    onChange={(e) => updateScore(q.id, e.target.value)}
                    placeholder="0"
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--white-muted)' }}>/ {maxMark}</span>
                </div>
              </div>
              <div className="sv-answer">
                {renderAnswer(answer, q)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="sv-save-bar glass-card">
        <div className="sv-total-preview">
          Total: <strong>{totalScore} / {totalMarks}</strong>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <Save size={16} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Marks'}
        </button>
      </div>
    </div>
  );
}
