import { useState, useMemo } from 'react';
import type { Page } from '../App';
import { authApi } from '../api/authApi';
import { SUBJECT_COEFFICIENTS, calculateMG, calculateFG, SECTION_MAP } from '../utils/ScoreUtils';
import type { Section } from '../utils/ScoreUtils';
import s from './FloatingProfileWidget.module.css';

interface Note {
  id: string;
  matiereNom: string;
  valeur: number;
  annee: number;
}

interface Props {
  user: any;
  page: Page;
  onProfileUpdate: () => void;
  onNav?: (p: Page) => void;
}

function gradeClass(v: number) {
  if (v >= 14) return s.high;
  if (v < 10)  return s.low;
  return '';
}

export default function FloatingProfileWidget({ user, page, onProfileUpdate, onNav }: Props) {
  const [expanded,  setExpanded]  = useState(false);
  const [editMode,  setEditMode]  = useState(false);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const profile    = user?.studentProfile ?? {};
  const sectionRaw: string = user?.section?.nom ?? '';
  const sectionKey: Section = SECTION_MAP[sectionRaw] ?? 'Math';
  const notes: Note[]       = user?.notes ?? [];

  // Build a map: subject → valeur for the current user notes
  const noteMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of notes) m[n.matiereNom] = n.valeur;
    return m;
  }, [notes]);

  // Live preview of recalculated scores from draft (edit mode)
  const previewScores = useMemo(() => {
    if (!editMode) return null;
    const notesP: Record<string, string> = {};
    const coeffs = SUBJECT_COEFFICIENTS[sectionKey] ?? {};
    for (const sub of Object.keys(coeffs)) {
      notesP[sub] = draftNotes[sub] ?? String(noteMap[sub] ?? 0);
    }
    const mg = calculateMG(sectionKey, notesP);
    const fg = calculateFG(sectionKey, mg, notesP);
    return { mg, fg };
  }, [editMode, draftNotes, noteMap, sectionKey]);

  // ── Rules of Hooks: ALL hooks must run before any early return ──
  if (!user || page === 'specialite-detail') return null;

  /* ─── Handlers ────────────────────────────────── */
  const handleEditOpen = () => {
    const draft: Record<string, string> = {};
    for (const n of notes) draft[n.matiereNom] = String(n.valeur);
    setDraftNotes(draft);
    setEditMode(true);
    setFeedback(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setDraftNotes({});
    setFeedback(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const coeffs = SUBJECT_COEFFICIENTS[sectionKey] ?? {};
      const notesP: Record<string, string> = {};
      for (const sub of Object.keys(coeffs)) {
        notesP[sub] = draftNotes[sub] ?? String(noteMap[sub] ?? 0);
      }
      const mg = calculateMG(sectionKey, notesP);
      const fg = calculateFG(sectionKey, mg, notesP);

      const notesPayload = Object.entries(notesP)
        .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
        .map(([matiereNom, v]) => ({ matiereNom, valeur: parseFloat(v) }));

      await authApi.updateNotes({ notes: notesPayload, newMoyenneBac: mg, newScore: fg });

      setFeedback({ type: 'ok', msg: 'Notes mises à jour ✓' });
      setEditMode(false);
      setDraftNotes({});
      onProfileUpdate(); // refresh user data in parent
    } catch {
      setFeedback({ type: 'err', msg: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Collapsed view ──────────────────────────── */
  if (!expanded) {
    return (
      <div className={s.widgetContainer}>
        <button className={s.collapsedBtn} onClick={() => setExpanded(true)} aria-label="Ouvrir le profil">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {user.prenom} {user.nom}
          {profile.score != null && (
            <span className={s.collapsedScore}>{profile.score.toFixed(1)}</span>
          )}
        </button>
      </div>
    );
  }

  /* ─── Expanded panel ──────────────────────────── */
  const coeffs = SUBJECT_COEFFICIENTS[sectionKey] ?? {};
  // Show all subjects — union of DB notes and section's known subjects
  const subjectSet = new Set([...Object.keys(coeffs), ...notes.map(n => n.matiereNom)]);
  const subjects = [...subjectSet]; // Option stays in the list

  return (
    <div className={s.widgetContainer}>
      <div className={s.panel}>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.titleRow}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <h3 className={s.title}>{user.prenom} {user.nom}</h3>
            </div>
            <p className={s.headerEmail}>{user.email}</p>
          </div>
          <button className={s.closeBtn} onClick={() => { setExpanded(false); handleCancel(); }} aria-label="Fermer">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={s.body}>
          {/* Tags */}
          <div className={s.tags}>
            {sectionRaw && <span className={s.tag}>{sectionRaw}</span>}
            {profile.region && <span className={s.tag}>{profile.region}</span>}
          </div>

          {/* Stats */}
          <div className={s.statsGrid}>
            <div className={s.statBox}>
              <span className={s.statLabel}>Moyenne Bac</span>
              <span className={s.statValue}>
                {editMode && previewScores
                  ? previewScores.mg.toFixed(3)
                  : profile.moyenneBac != null ? profile.moyenneBac.toFixed(3) : '--'}
              </span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>Score Final</span>
              <span className={`${s.statValue} ${s.highlight}`}>
                {editMode && previewScores
                  ? previewScores.fg.toFixed(2)
                  : profile.score != null ? profile.score.toFixed(2) : '--'}
              </span>
            </div>
          </div>

          {/* Grades section */}
          {subjects.length > 0 && (
            <div>
              <p className={s.sectionTitle}>
                Mes notes
                <button
                  className={`${s.editToggleBtn} ${editMode ? s.active : ''}`}
                  onClick={editMode ? handleCancel : handleEditOpen}
                >
                  {editMode ? 'Annuler' : 'Modifier'}
                </button>
              </p>

              <div className={s.gradeList}>
                {subjects.map(sub => {
                  const coeff = coeffs[sub] ?? 1;
                  const isOption = sub === 'Option';

                  if (!editMode) {
                    const val = noteMap[sub];
                    const bonus = isOption && val != null && val > 10 ? val - 10 : null;
                    return (
                      <div key={sub} className={s.gradeRow}>
                        <span className={s.gradeName}>
                          {sub}
                          {isOption
                            ? <span style={{ color: '#F47920', fontSize: 10, marginLeft: 4, fontWeight: 600 }}>bonus {'>'} 10</span>
                            : <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>×{coeff}</span>
                          }
                        </span>
                        <span className={`${s.gradeVal} ${val != null ? gradeClass(val) : ''}`}>
                          {val != null ? val.toFixed(2) : '—'}
                          {bonus != null && (
                            <span style={{ fontSize: 10, color: '#16a34a', marginLeft: 4 }}>(+{bonus.toFixed(2)})</span>
                          )}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={sub} className={s.gradeEditRow}>
                      <span className={s.gradeName}>
                        {sub}
                        {isOption
                          ? <span style={{ color: '#F47920', fontSize: 10, marginLeft: 4, fontWeight: 600 }}>bonus {'>'} 10</span>
                          : <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>×{coeff}</span>
                        }
                      </span>
                      <input
                        className={s.gradeInput}
                        type="number"
                        min={0}
                        max={20}
                        step={0.01}
                        value={draftNotes[sub] ?? String(noteMap[sub] ?? '')}
                        onChange={e => setDraftNotes(prev => ({ ...prev, [sub]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <p className={feedback.type === 'ok' ? s.successMsg : s.errorMsg}>{feedback.msg}</p>
          )}
        </div>

        {/* Footer: always visible, edit actions + recommendations CTA */}
        <div className={s.footer} style={{ flexDirection: 'column', gap: 8 }}>
          {/* Recommendations teaser */}
          {!editMode && user?.questionnaire && onNav && (
            <button
              className={s.saveBtn}
              onClick={() => { setExpanded(false); onNav('recommandations'); }}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', width: '100%' }}
            >
              ✨ Voir mes métiers recommandés
            </button>
          )}
          {/* Save / Cancel — only in edit mode */}
          {editMode && (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className={s.cancelBtn} onClick={handleCancel} disabled={saving}>Annuler</button>
              <button className={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde…' : 'Enregistrer les notes'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
