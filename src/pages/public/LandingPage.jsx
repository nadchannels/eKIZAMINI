import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LANGUAGES, switchLanguage } from '../../lib/translations';
import { BookOpen, Clock, ChevronRight, Users, User } from 'lucide-react';
import './LandingPage.css';

const FACULTIES = [
  'Filmmaking and Video Production',
  'Multimedia Production',
  'Photography and Graphic Design',
  'Software Development',
];

const STEPS = ['language', 'info', 'exams'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => sessionStorage.getItem('ek_step') || 'language');
  const [lang, setLang] = useState(() => sessionStorage.getItem('ek_lang') || 'en');
  const [hasPartner, setHasPartner] = useState(false);
  const [trainee, setTrainee] = useState({ name: '', faculty: '', regNumber: '' });
  const [partner, setPartner] = useState({ name: '', faculty: '', regNumber: '' });
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [formError, setFormError] = useState('');

  const setStepPersistent = (newStep) => {
    setStep(newStep);
    sessionStorage.setItem('ek_step', newStep);
  };

  const handleLangSelect = (code, gtCode) => {
    setLang(code);
    sessionStorage.setItem('ek_lang', code);
    setStepPersistent('info');
    
    if (gtCode) switchLanguage(gtCode);
    else switchLanguage(null);
  };

  const handleTraineeChange = (e) =>
    setTrainee((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePartnerChange = (e) =>
    setPartner((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!trainee.name || !trainee.faculty || !trainee.regNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (hasPartner && (!partner.name || !partner.faculty || !partner.regNumber)) {
      setFormError('Please fill in all partner fields.');
      return;
    }
    // Save to session
    sessionStorage.setItem('ek_trainee', JSON.stringify(trainee));
    sessionStorage.setItem('ek_partner', hasPartner ? JSON.stringify(partner) : '');
    // Load available exams
    setLoadingExams(true);
    setStepPersistent('exams');
    const q = query(collection(db, 'exams'), where('status', '==', 'current'));
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Filter by faculty
    const filtered = all.filter(
      (ex) => ex.faculty === 'All Faculties' || ex.faculty === trainee.faculty
    );
    setExams(filtered);
    setLoadingExams(false);
  };

  const handleTakeExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  return (
    <div className="landing-page">
      {/* Background */}
      <div className="landing-bg">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-grid-overlay" />
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <div className="landing-logo-icon"><BookOpen size={20} /></div>
          <span className="landing-logo-text">eKIZAMINI</span>
        </div>
        <div className="landing-sub">NAD Production</div>
      </header>

      <main className="landing-main">
        {/* ── STEP 1: Language ─────────────────────────────── */}
        {step === 'language' && (
          <div className="landing-card glass-card animate-scale">
            <div className="landing-card-icon">
              <BookOpen size={32} />
            </div>
            <h1 className="landing-title">Welcome to eKIZAMINI</h1>
            <p className="landing-desc">
              Online Examination Platform by NAD Production.<br />
              Choose your preferred language to continue.
            </p>

            <div className="lang-grid">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  id={`lang-${l.code}`}
                  className={`lang-btn${lang === l.code ? ' active' : ''}`}
                  onClick={() => handleLangSelect(l.code, l.gtCode)}
                >
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-label">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Trainee Info ──────────────────────────── */}
        {step === 'info' && (
          <div className="landing-card glass-card animate-fade" style={{ maxWidth: 600 }}>
            <button className="back-btn" onClick={() => setStepPersistent('language')}>← Back</button>
            <h2 className="landing-title" style={{ fontSize: '1.75rem' }}>Your Information</h2>
            <p className="landing-desc">Please fill in your details before accessing the exam.</p>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleInfoSubmit} className="info-form">
              {/* Trainee */}
              <div className="info-section">
                <div className="info-section-label">
                  <User size={16} /> Trainee
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    name="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={trainee.name}
                    onChange={handleTraineeChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    name="faculty"
                    className="form-input"
                    value={trainee.faculty}
                    onChange={handleTraineeChange}
                    required
                  >
                    <option value="">-- Select your faculty --</option>
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number *</label>
                  <input
                    name="regNumber"
                    className="form-input"
                    placeholder="e.g. NAD/2024/001"
                    value={trainee.regNumber}
                    onChange={handleTraineeChange}
                    required
                  />
                </div>
              </div>

              {/* Partner toggle */}
              <label className="checkbox-group partner-toggle">
                <input
                  type="checkbox"
                  checked={hasPartner}
                  onChange={(e) => setHasPartner(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)' }}>
                    <Users size={14} style={{ display: 'inline', marginRight: 6 }} />
                    I have a partner
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--white-muted)' }}>
                    Check this if this is a partner/group submission
                  </div>
                </div>
              </label>

              {/* Partner fields */}
              {hasPartner && (
                <div className="info-section info-section-partner animate-fade">
                  <div className="info-section-label">
                    <Users size={16} /> Partner
                  </div>
                  <div className="form-group">
                    <label className="form-label">Partner Full Name *</label>
                    <input
                      name="name"
                      className="form-input"
                      placeholder="Partner's full name"
                      value={partner.name}
                      onChange={handlePartnerChange}
                      required={hasPartner}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Partner Faculty *</label>
                    <select
                      name="faculty"
                      className="form-input"
                      value={partner.faculty}
                      onChange={handlePartnerChange}
                      required={hasPartner}
                    >
                      <option value="">-- Select faculty --</option>
                      {FACULTIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Partner Reg Number *</label>
                    <input
                      name="regNumber"
                      className="form-input"
                      placeholder="Partner's registration number"
                      value={partner.regNumber}
                      onChange={handlePartnerChange}
                      required={hasPartner}
                    />
                  </div>
                </div>
              )}

              <button id="info-submit" type="submit" className="btn btn-primary btn-lg w-full">
                Continue <ChevronRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 3: Available Exams ───────────────────────── */}
        {step === 'exams' && (
          <div className="animate-fade" style={{ width: '100%', maxWidth: 800 }}>
            <button className="back-btn" onClick={() => setStepPersistent('info')}>← Back</button>
            <h2 className="landing-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
              Available Exams
            </h2>
            <p className="landing-desc" style={{ marginBottom: 32 }}>
              Welcome, <strong style={{ color: 'var(--white)' }}>{trainee.name}</strong>!
              Here are your available exams.
            </p>

            {loadingExams && (
              <div className="flex justify-center" style={{ padding: 60 }}>
                <div className="spinner" />
              </div>
            )}

            {!loadingExams && exams.length === 0 && (
              <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                <BookOpen size={48} style={{ color: 'var(--white-muted)', margin: '0 auto 16px' }} />
                <h3>No exams available</h3>
                <p>There are no active exams for your faculty at this time. Check back later.</p>
              </div>
            )}

            {!loadingExams && exams.map((exam) => (
              <div key={exam.id} className="exam-card glass-card animate-fade">
                <div className="exam-card-content">
                  <div className="exam-card-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="exam-card-info">
                    <h3 className="exam-card-title">{exam.title}</h3>
                    <div className="exam-card-meta">
                      <span><Clock size={13} /> Prep: {exam.prepTime} min</span>
                      <span><Clock size={13} /> Exam: {exam.duration} min</span>
                      <span>{exam.questions?.length || 0} questions</span>
                    </div>
                    {exam.faculty && exam.faculty !== 'All Faculties' && (
                      <div className="exam-card-faculty">{exam.faculty}</div>
                    )}
                  </div>
                  <button
                    id={`take-exam-${exam.id}`}
                    className="btn btn-primary"
                    onClick={() => handleTakeExam(exam.id)}
                  >
                    Take Exam <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} NAD Production. All rights reserved.</p>
      </footer>
    </div>
  );
}
