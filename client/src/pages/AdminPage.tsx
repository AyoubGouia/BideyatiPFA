import React, { useState, useEffect, useCallback } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import { adminApi, type AdminStats, type AdminUser } from '../api/adminApi'
import apiClient from '../api/client'
import s from './AdminPage.module.css'

interface Props {
  nav: (p: Page) => void
}

interface Universite {
  id: string
  nom: string
  ville: string
  region: string
  description: string | null
  specialites?: { nom: string }[]
}

interface BackupRecord {
  date: string
  time: string
  size: string
  filename: string
}

const BACKUP_STORAGE_KEY = 'bideyati_backup_history'

function loadBackupHistory(): BackupRecord[] {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveBackupHistory(records: BackupRecord[]) {
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(records.slice(0, 10)))
}

export default function AdminPage({ nav }: Props) {
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'universities' | 'backup'>('dashboard')

  // ── Dashboard ──────────────────────────────────────────────
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // ── Users ──────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Universities ───────────────────────────────────────────
  const [universities, setUniversities] = useState<Universite[]>([])
  const [univSearch, setUnivSearch] = useState('')
  const [univLoading, setUnivLoading] = useState(false)

  // ── Backup ─────────────────────────────────────────────────
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(loadBackupHistory)

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

  // Load stats on mount
  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .finally(() => setStatsLoading(false))
  }, [])

  // Load users when tab is active, or search/page changes
  const loadUsers = useCallback(async (page: number, search: string) => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await adminApi.getUsers(page, 10, search || undefined)
      setUsers(res.users)
      setUsersTotal(res.total)
      setUsersTotalPages(res.totalPages)
    } catch {
      setUsersError('Impossible de charger les utilisateurs.')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers(usersPage, usersSearch)
  }, [activeTab, usersPage, usersSearch, loadUsers])

  // Load universities when tab is active
  useEffect(() => {
    if (activeTab !== 'universities' || universities.length > 0) return
    setUnivLoading(true)
    apiClient.get('/universites')
      .then(res => setUniversities(res.data))
      .finally(() => setUnivLoading(false))
  }, [activeTab])

  const handleSearchUsers = (val: string) => {
    setUsersSearch(val)
    setUsersPage(1)
  }

  const handleToggle = async (userId: string) => {
    setTogglingId(userId)
    try {
      const updated = await adminApi.toggleUserActive(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, actif: updated.actif } : u))
    } catch {
      // silently fail; row stays unchanged
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    setDeletingId(userId)
    try {
      await adminApi.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setUsersTotal(prev => prev - 1)
    } catch {
      alert('Échec de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateBackup = async () => {
    setBackupLoading(true)
    try {
      const blob = await adminApi.exportBackup()
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toTimeString().slice(0, 5)
      const filename = `bideyati-backup-${dateStr}.json`
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2) + ' MB'

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      // Save to history
      const newRecord: BackupRecord = { date: dateStr, time: timeStr, size: sizeMB, filename }
      const updated = [newRecord, ...backupHistory]
      setBackupHistory(updated)
      saveBackupHistory(updated)
    } catch {
      alert('Échec de la création de la sauvegarde.')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDeleteBackup = (filename: string) => {
    if (!confirm('Supprimer cette entrée de l\'historique ?')) return
    const updated = backupHistory.filter(r => r.filename !== filename)
    setBackupHistory(updated)
    saveBackupHistory(updated)
  }

  const filteredUniversities = universities.filter(u =>
    u.nom.toLowerCase().includes(univSearch.toLowerCase()) ||
    u.ville.toLowerCase().includes(univSearch.toLowerCase())
  )

  const adminInitial = (user?.prenom?.[0] ?? 'A').toUpperCase()
  const adminFullName = user ? `${user.prenom} ${user.nom}` : 'Administrateur'

  return (
    <div className={s.page}>
      {/* SIDEBAR */}
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>
          <h2 className={s.sidebarLogoTitle}>Orientation Bac</h2>
          <p className={s.sidebarLogoSub}>Administration</p>
        </div>

        <nav className={s.sidebarNav}>
          <button
            className={`${s.navItem} ${activeTab === 'dashboard' ? s.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Tableau de bord
          </button>
          <button
            className={`${s.navItem} ${activeTab === 'users' ? s.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Utilisateurs
          </button>
          <button
            className={`${s.navItem} ${activeTab === 'universities' ? s.active : ''}`}
            onClick={() => setActiveTab('universities')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Universités
          </button>
          <button
            className={`${s.navItem} ${activeTab === 'backup' ? s.active : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Sauvegarde
          </button>
        </nav>

        <div className={s.sidebarFooter}>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className={s.content}>
        {/* TOP BAR */}
        <header className={s.topbar}>
          <div className={s.searchBar}>
            <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={activeTab === 'users' ? usersSearch : activeTab === 'universities' ? univSearch : ''}
              onChange={e => {
                if (activeTab === 'users') handleSearchUsers(e.target.value)
                else if (activeTab === 'universities') setUnivSearch(e.target.value)
              }}
            />
          </div>

          <div className={s.topbarRight}>
            <div className={s.adminInfo}>
              <div className={s.adminAvatar}>{adminInitial}</div>
              <div>
                <p className={s.adminName}>{adminFullName}</p>
                <p className={s.adminName} style={{ fontSize: '12px', opacity: 0.7 }}>Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className={s.main}>

          {/* ─── DASHBOARD ─── */}
          {activeTab === 'dashboard' && (
            <>
              <h1 className={s.pageTitle}>Tableau de bord</h1>
              <p className={s.pageSubtitle}>Vue d'ensemble du système d'orientation</p>

              <div className={s.statsGrid}>
                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Total Utilisateurs</p>
                      <p className={s.statValue}>{statsLoading ? '…' : (stats?.totalUsers ?? 0).toLocaleString('fr-DZ')}</p>
                      <p className={s.statChange}>Étudiants: {stats?.totalStudents ?? '…'}</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.green}`}>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  </div>
                </div>

                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Universités</p>
                      <p className={s.statValue}>{statsLoading ? '…' : (stats?.totalUniversities ?? 0).toLocaleString('fr-DZ')}</p>
                      <p className={s.statChange} style={{ color: '#7a9a7a' }}>Établissements: {stats?.totalEstablishments ?? '…'}</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.blue}`}>
                      <svg style={{ width: '20px', height: '20px', color: '#1976d2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    </div>
                  </div>
                </div>

                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Spécialités</p>
                      <p className={s.statValue}>{statsLoading ? '…' : (stats?.totalSpecialties ?? 0).toLocaleString('fr-DZ')}</p>
                      <p className={s.statChange}>Filières disponibles</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.green}`}>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.chartsRow}>
                <div className={s.chartCard}>
                  <h3 className={s.chartTitle}>Répartition des utilisateurs</h3>
                  <div className={s.chartCanvas}>
                    <svg className={s.barChart} viewBox="0 0 400 200" preserveAspectRatio="none">
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="40" y1="120" x2="380" y2="120" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4" />
                      <text x="30" y="175" fontSize="10" fill="#9cad9c" textAnchor="end">Visiteurs</text>
                      <text x="30" y="125" fontSize="10" fill="#9cad9c" textAnchor="end">Admins</text>
                      <text x="30" y="75" fontSize="10" fill="#9cad9c" textAnchor="end">Étudiants</text>
                      {stats && (() => {
                        const max = Math.max(stats.totalStudents, stats.totalAdmins, stats.totalVisitors, 1)
                        const h = (v: number) => Math.round((v / max) * 130)
                        return (
                          <>
                            <rect x="80" y={170 - h(stats.totalStudents)} width="60" height={h(stats.totalStudents)} fill="#F47920" rx="4" />
                            <rect x="180" y={170 - h(stats.totalAdmins)} width="60" height={h(stats.totalAdmins)} fill="#f59e0b" rx="4" />
                            <rect x="280" y={170 - h(stats.totalVisitors)} width="60" height={h(stats.totalVisitors)} fill="#94a3b8" rx="4" />
                            <text x="110" y="188" fontSize="10" fill="#9cad9c" textAnchor="middle">Étudiants</text>
                            <text x="210" y="188" fontSize="10" fill="#9cad9c" textAnchor="middle">Admins</text>
                            <text x="310" y="188" fontSize="10" fill="#9cad9c" textAnchor="middle">Visiteurs</text>
                          </>
                        )
                      })()}
                    </svg>
                  </div>
                </div>

                <div className={s.chartCard}>
                  <h3 className={s.chartTitle}>Vue d'ensemble</h3>
                  <div className={s.chartCanvas} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                    {[
                      { label: 'Utilisateurs actifs', value: stats ? stats.totalStudents + stats.totalAdmins : 0, total: stats?.totalUsers ?? 1, color: '#F47920' },
                      { label: 'Universités indexées', value: stats?.totalUniversities ?? 0, total: Math.max(stats?.totalUniversities ?? 0, 1), color: '#1976d2' },
                      { label: 'Spécialités disponibles', value: stats?.totalSpecialties ?? 0, total: Math.max(stats?.totalSpecialties ?? 0, 1), color: '#16a34a' },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#12122a' }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: 700 }}>{item.value}</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.round((item.value / item.total) * 100))}%`, background: item.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── USERS ─── */}
          {activeTab === 'users' && (
            <div className={s.usersContainer}>
              <div className={s.usersHeader}>
                <div>
                  <h1 className={s.pageTitle}>Gestion des utilisateurs</h1>
                  <p className={s.pageSubtitle}>{usersTotal} utilisateur{usersTotal !== 1 ? 's' : ''} au total</p>
                </div>
              </div>

              <div className={s.tableCard}>
                <div className={s.tableToolbar}>
                  <div className={s.searchBarOutline}>
                    <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={usersSearch}
                      onChange={e => handleSearchUsers(e.target.value)}
                    />
                  </div>
                </div>

                {usersError && <p style={{ color: '#ef4444', padding: '12px 20px', fontSize: '14px' }}>{usersError}</p>}

                <div className={s.tableWrapper}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Statut</th>
                        <th>Date d'inscription</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#8a96a2' }}>Chargement...</td></tr>
                      )}
                      {!usersLoading && users.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#8a96a2' }}>Aucun utilisateur trouvé.</td></tr>
                      )}
                      {!usersLoading && users.map(u => (
                        <tr key={u.id} style={{ opacity: !u.actif ? 0.55 : 1 }}>
                          <td>
                            <div className={s.userCell}>
                              <div className={s.userAvatar} style={{ background: u.actif ? '#e8f5e9' : '#f1f5f9', color: u.actif ? '#2e7d32' : '#64748b' }}>
                                {u.prenom[0].toUpperCase()}
                              </div>
                              <span className={s.userName}>{u.prenom} {u.nom}</span>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>{u.telephone ?? '—'}</td>
                          <td>
                            <span className={`${s.badge} ${u.actif ? s.badgeActive : s.badgeInactive}`}>
                              {u.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td>{new Date(u.dateCreation).toLocaleDateString('fr-DZ')}</td>
                          <td>
                            <div className={s.univActions}>
                              <button
                                className={s.actionBtn}
                                title={u.actif ? 'Désactiver' : 'Activer'}
                                disabled={togglingId === u.id || deletingId === u.id}
                                onClick={() => handleToggle(u.id)}
                                style={{ color: u.actif ? '#f59e0b' : '#16a34a' }}
                              >
                                {togglingId === u.id ? '…' : u.actif
                                  ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                  : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                }
                              </button>
                              <button
                                className={s.actionBtn}
                                title="Supprimer"
                                disabled={togglingId === u.id || deletingId === u.id}
                                onClick={() => handleDelete(u.id)}
                                style={{ color: '#ef4444' }}
                              >
                                {deletingId === u.id ? '…' : <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {usersTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0 8px' }}>
                    <button className={s.actionBtn} disabled={usersPage <= 1} onClick={() => setUsersPage(p => p - 1)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '7px' }}>Précédent</button>
                    <span style={{ fontSize: '13px', color: '#8a96a2' }}>Page {usersPage} / {usersTotalPages}</span>
                    <button className={s.actionBtn} disabled={usersPage >= usersTotalPages} onClick={() => setUsersPage(p => p + 1)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '7px' }}>Suivant</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── UNIVERSITIES ─── */}
          {activeTab === 'universities' && (
            <div className={s.universitiesContainer}>
              <div className={s.usersHeader}>
                <div>
                  <h1 className={s.pageTitle}>Gestion des universités</h1>
                  <p className={s.pageSubtitle}>
                    {univLoading ? 'Chargement...' : `${filteredUniversities.length} université${filteredUniversities.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <div className={s.tableCard} style={{ marginBottom: '20px' }}>
                <div className={s.tableToolbar}>
                  <div className={s.searchBarOutline}>
                    <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      placeholder="Rechercher une université..."
                      value={univSearch}
                      onChange={e => setUnivSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {univLoading ? (
                <p style={{ color: '#8a96a2', textAlign: 'center', padding: '40px' }}>Chargement...</p>
              ) : (
                <div className={s.univGrid}>
                  {filteredUniversities.slice(0, 30).map(u => (
                    <div key={u.id} className={s.univCard}>
                      <div className={s.univCardTop}>
                        <div className={s.univIconBox}>
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div className={s.univActions}>
                          {/* Edit/delete reserved for future implementation */}
                        </div>
                      </div>
                      <h3 className={s.univName}>{u.nom}</h3>
                      <div className={s.univLoc}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {u.ville}
                      </div>
                      {u.description && (
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0', lineHeight: 1.5 }}>
                          {u.description.length > 100 ? u.description.slice(0, 100) + '…' : u.description}
                        </p>
                      )}
                      <div className={s.univInfoRow} style={{ marginTop: '10px' }}>
                        <div className={s.univLabel}>Région:</div>
                        <div className={s.univVal}>{u.region}</div>
                      </div>
                    </div>
                  ))}
                  {filteredUniversities.length === 0 && (
                    <p style={{ color: '#8a96a2', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Aucune université trouvée.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── BACKUP ─── */}
          {activeTab === 'backup' && (
            <div className={s.backupContainer}>
              <h1 className={s.pageTitle}>Sauvegarde & Restauration</h1>
              <p className={s.pageSubtitle}>Exporter les données de la base de données</p>

              <div className={s.backupGrid}>
                {/* Create Backup */}
                <div className={s.backupMainCard}>
                  <div className={s.backupCardHeader}>
                    <div className={s.backupIconBox} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                      <h3 className={s.backupCardTitle}>Créer une sauvegarde</h3>
                      <p className={s.backupCardSubtitle}>Exporter toutes les données en JSON</p>
                    </div>
                  </div>

                  <div className={s.backupInfoBox}>
                    <div className={s.backupInfoRow}>
                      <span>Dernière sauvegarde:</span>
                      <span className={s.bold}>{backupHistory[0]?.date ?? 'Jamais'}</span>
                    </div>
                    <div className={s.backupInfoRow}>
                      <span>Taille:</span>
                      <span className={s.bold}>{backupHistory[0]?.size ?? '—'}</span>
                    </div>
                  </div>

                  <button
                    className={s.btnPrimary}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {backupLoading ? 'Export en cours…' : 'Créer une sauvegarde'}
                  </button>
                  <p className={s.backupFooterNote}>La sauvegarde inclut tous les utilisateurs et universités</p>
                </div>

                {/* Restore info */}
                <div className={s.backupMainCard}>
                  <div className={s.backupCardHeader}>
                    <div className={s.backupIconBox} style={{ background: '#f0f9ff', color: '#0284c7' }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" /></svg>
                    </div>
                    <div>
                      <h3 className={s.backupCardTitle}>Restaurer une sauvegarde</h3>
                      <p className={s.backupCardSubtitle}>Récupérer des données précédentes</p>
                    </div>
                  </div>

                  <div className={s.backupWarningBox}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <div>
                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Information</span>
                        <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>Pour restaurer, téléchargez d'abord une sauvegarde depuis l'historique ci-dessous et contactez l'équipe technique.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className={s.historySection} style={{ marginTop: '32px' }}>
                <h2 className={s.sectionTitle} style={{ fontSize: '18px', marginBottom: '16px' }}>Historique des sauvegardes</h2>
                <div className={s.tableCard}>
                  <div className={s.tableWrapper}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Heure</th>
                          <th>Taille</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupHistory.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#8a96a2' }}>Aucune sauvegarde effectuée.</td></tr>
                        )}
                        {backupHistory.map(record => (
                          <tr key={record.filename}>
                            <td>{record.date}</td>
                            <td>{record.time}</td>
                            <td>{record.size}</td>
                            <td><span className={`${s.badge} ${s.badgeActive}`}>Terminé</span></td>
                            <td>
                              <div className={s.univActions}>
                                <button
                                  className={s.actionBtn}
                                  title="Supprimer de l'historique"
                                  onClick={() => handleDeleteBackup(record.filename)}
                                  style={{ color: '#ef4444' }}
                                >
                                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
