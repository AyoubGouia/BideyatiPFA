import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import s from './UserMenu.module.css'

interface Props {
  user: any;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: Props) {
  const { refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Form state
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateNaissance, setDateNaissance] = useState(
    user?.dateNaissance ? new Date(user.dateNaissance).toISOString().split('T')[0] : ''
  );
  const [numeroBAC, setNumeroBAC] = useState(user?.studentProfile?.numeroBac || '');
  const [motDePasse, setMotDePasse] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const openModal = () => {
    setMenuOpen(false);
    setModalOpen(true);
    setError(null);
    setSuccess(false);
    // Reset form
    setNom(user?.nom || '');
    setPrenom(user?.prenom || '');
    setEmail(user?.email || '');
    setDateNaissance(user?.dateNaissance ? new Date(user.dateNaissance).toISOString().split('T')[0] : '');
    setNumeroBAC(user?.studentProfile?.numeroBac || '');
    setMotDePasse('');
  };

  const validate = () => {
    if (!nom || !prenom || !email || !numeroBAC || !dateNaissance) {
      return "Tous les champs (sauf le mot de passe) sont obligatoires.";
    }
    if (!/^\d{6}$/.test(numeroBAC)) {
      return "Le numéro de Bac doit être composé de 6 chiffres exactement.";
    }
    
    // Age validation
    const dob = new Date(dateNaissance);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 17 || age > 90) {
      return "Vous devez avoir entre 17 et 90 ans.";
    }

    if (motDePasse && motDePasse.length < 6) {
      return "Le nouveau mot de passe doit contenir au moins 6 caractères.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await authApi.updateSettings({
        nom,
        prenom,
        email,
        dateNaissance,
        numeroBAC,
        ...(motDePasse ? { motDePasse } : {})
      });
      setSuccess(true);
      refreshUser(); // Update global context
      setTimeout(() => {
        setModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la mise à jour des paramètres.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={s.wrapper} ref={menuRef}>
      {/* Trigger Badge */}
      <div 
        className={`${s.userBadge} ${menuOpen ? s.active : ''}`} 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className={s.avatarIcon}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        {user.prenom || 'Etudiant'}
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className={s.dropdown}>
          <button className={s.menuItem} onClick={openModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Paramètres du profil
          </button>
          
          <div className={s.separator} />
          
          <button className={`${s.menuItem} ${s.dangerItem}`} onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Se déconnecter
          </button>
        </div>
      )}

      {/* Settings Modal - Rendered via Portal to escape header backdrop-filter constraints */}
      {modalOpen && createPortal(
        <div className={s.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Paramètres du profil</h2>
              <button className={s.closeBtn} onClick={() => setModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={s.modalBody}>
                {error && <div className={s.globalError}>{error}</div>}
                {success && <div className={s.successMsg}>Profil mis à jour avec succès ✓</div>}

                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.label}>Prénom</label>
                    <input className={s.input} value={prenom} onChange={e => setPrenom(e.target.value)} required />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>Nom</label>
                    <input className={s.input} value={nom} onChange={e => setNom(e.target.value)} required />
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Email</label>
                  <input type="email" className={s.input} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.label}>Date de Naissance</label>
                    <input type="date" className={s.input} value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} required />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>Numéro BAC</label>
                    <input type="text" className={s.input} maxLength={6} placeholder="ex: 123456" value={numeroBAC} onChange={e => setNumeroBAC(e.target.value)} required />
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Nouveau mot de passe</label>
                  <input type="password" className={s.input} placeholder="Laissez vide pour conserver l'actuel" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} />
                </div>
              </div>

              <div className={s.modalFooter}>
                <button type="button" className={s.cancelBtn} onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className={s.saveBtn} disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
