import React, { useState } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s from './AdminPage.module.css'

interface Props {
  nav: (p: Page) => void
}

export default function AdminPage({ nav }: Props) {
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'universities' | 'backup'>('dashboard')

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

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
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Tableau de bord
          </button>
          <button 
            className={`${s.navItem} ${activeTab === 'users' ? s.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Utilisateurs
          </button>
          <button 
            className={`${s.navItem} ${activeTab === 'universities' ? s.active : ''}`}
            onClick={() => setActiveTab('universities')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Universités
          </button>
          <button 
            className={`${s.navItem} ${activeTab === 'backup' ? s.active : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Sauvegarde
          </button>

        </nav>

        <div className={s.sidebarFooter}>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className={s.content}>
        {/* TOP BAR */}
        <header className={s.topbar}>
          <div className={s.searchBar}>
            <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Rechercher..." />
          </div>

          <div className={s.topbarRight}>
            <button className={s.notifBtn}>
              <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className={s.notifDot}></span>
            </button>
            <div className={s.adminInfo}>
              <div className={s.adminAvatar}>A</div>
              <div>
                <p className={s.adminName}>Administrateur</p>
                <p className={s.adminName} style={{fontSize: '12px', opacity: 0.7}}>Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD */}
        <main className={s.main}>
          {activeTab === 'dashboard' ? (
            <>
              <h1 className={s.pageTitle}>Tableau de bord</h1>
              <p className={s.pageSubtitle}>Vue d'ensemble du système d'orientation</p>

              {/* STAT CARDS */}
              <div className={s.statsGrid}>
                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Total Utilisateurs</p>
                      <p className={s.statValue}>1,234</p>
                      <p className={s.statChange}>+12%</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.green}`}>
                      <svg style={{width:'20px', height:'20px', color:'#F47920'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  </div>
                </div>

                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Universités</p>
                      <p className={s.statValue}>89</p>
                      <p className={s.statChange} style={{color:'#7a9a7a'}}>+5</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.blue}`}>
                      <svg style={{width:'20px', height:'20px', color:'#1976d2'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    </div>
                  </div>
                </div>


                <div className={s.statCard}>
                  <div className={s.statHeader}>
                    <div>
                      <p className={s.statLabel}>Taux de réussite</p>
                      <p className={s.statValue}>92%</p>
                      <p className={s.statChange}>+3%</p>
                    </div>
                    <div className={`${s.statIconWrap} ${s.green}`}>
                      <svg style={{width:'20px', height:'20px', color:'#F47920'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHARTS */}
              <div className={s.chartsRow}>
                <div className={s.chartCard}>
                  <h3 className={s.chartTitle}>Évolution mensuelle</h3>
                  <div className={s.chartCanvas}>
                    {/* SVG Line Chart Placeholder matching design */}
                    <svg className={s.lineChart} viewBox="0 0 400 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="70" x2="380" y2="70" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="120" x2="380" y2="120" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="170" x2="380" y2="170" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      
                      {/* Y Axis Labels */}
                      <text x="30" y="25" fontSize="10" fill="#9cad9c" textAnchor="end">220</text>
                      <text x="30" y="75" fontSize="10" fill="#9cad9c" textAnchor="end">165</text>
                      <text x="30" y="125" fontSize="10" fill="#9cad9c" textAnchor="end">110</text>
                      <text x="30" y="175" fontSize="10" fill="#9cad9c" textAnchor="end">55</text>
                      
                      {/* Line Path */}
                      <path d="M50 160 L120 140 L190 125 L260 115 L330 110" fill="none" stroke="#F47920" strokeWidth="3" />
                      
                      {/* Points */}
                      <circle cx="50" cy="160" r="4" fill="#ffffff" stroke="#F47920" strokeWidth="2" />
                      <circle cx="120" cy="140" r="4" fill="#ffffff" stroke="#F47920" strokeWidth="2" />
                      <circle cx="190" cy="125" r="4" fill="#ffffff" stroke="#F47920" strokeWidth="2" />
                      <circle cx="260" cy="115" r="4" fill="#ffffff" stroke="#F47920" strokeWidth="2" />
                      <circle cx="330" cy="110" r="4" fill="#ffffff" stroke="#F47920" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className={s.chartCard}>
                  <h3 className={s.chartTitle}>Universités par domaine</h3>
                  <div className={s.chartCanvas}>
                    {/* SVG Bar Chart Placeholder matching design */}
                    <svg className={s.barChart} viewBox="0 0 400 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="70" x2="380" y2="70" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="120" x2="380" y2="120" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>
                      <line x1="40" y1="170" x2="380" y2="170" stroke="#f0f4f0" strokeWidth="1" strokeDasharray="4,4"/>

                      {/* Y Axis Labels */}
                      <text x="30" y="25" fontSize="10" fill="#9cad9c" textAnchor="end">60</text>
                      <text x="30" y="75" fontSize="10" fill="#9cad9c" textAnchor="end">45</text>
                      <text x="30" y="125" fontSize="10" fill="#9cad9c" textAnchor="end">30</text>
                      <text x="30" y="175" fontSize="10" fill="#9cad9c" textAnchor="end">15</text>

                      {/* Bars */}
                      <rect x="60" y="110" width="30" height="60" fill="#f59e0b" rx="4" />
                      <rect x="110" y="130" width="30" height="40" fill="#f59e0b" rx="4" />
                      <rect x="160" y="150" width="30" height="20" fill="#f59e0b" rx="4" />
                      <rect x="210" y="160" width="30" height="10" fill="#f59e0b" rx="4" />
                      <rect x="260" y="80" width="30" height="90" fill="#f59e0b" rx="4" />
                      <rect x="310" y="120" width="30" height="50" fill="#f59e0b" rx="4" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'users' ? (
            <div className={s.usersContainer}>
              <div className={s.usersHeader}>
                <div>
                  <h1 className={s.pageTitle}>Gestion des utilisateurs</h1>
                  <p className={s.pageSubtitle}>Gérer les comptes élèves</p>
                </div>
                <button className={s.btnPrimary}>+ Nouvel utilisateur</button>
              </div>

              <div className={s.tableCard}>
                <div className={s.tableToolbar}>
                  <div className={s.searchBarOutline}>
                    <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Rechercher un utilisateur..." />
                  </div>
                </div>

                <div className={s.tableWrapper}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Statut</th>
                        <th>Date d'inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className={s.userCell}>
                            <div className={s.userAvatar} style={{background: '#e8f5e9', color: '#2e7d32'}}>A</div>
                            <span className={s.userName}>Ahmed Mansouri</span>
                          </div>
                        </td>
                        <td>ahmed.m@email.com</td>
                        <td>0612345678</td>
                        <td><span className={`${s.badge} ${s.badgeActive}`}>Actif</span></td>
                        <td>2026-01-15</td>
                      </tr>
                      <tr>
                        <td>
                          <div className={s.userCell}>
                            <div className={s.userAvatar} style={{background: '#e8f5e9', color: '#2e7d32'}}>F</div>
                            <span className={s.userName}>Fatima Zahra</span>
                          </div>
                        </td>
                        <td>fatima.z@email.com</td>
                        <td>0623456789</td>
                        <td><span className={`${s.badge} ${s.badgeActive}`}>Actif</span></td>
                        <td>2026-02-10</td>
                      </tr>
                      <tr>
                        <td>
                          <div className={s.userCell}>
                            <div className={s.userAvatar} style={{background: '#f1f5f9', color: '#64748b'}}>Y</div>
                            <span className={s.userName}>Youssef Khalil</span>
                          </div>
                        </td>
                        <td>youssef.k@email.com</td>
                        <td>0634567890</td>
                        <td><span className={`${s.badge} ${s.badgeInactive}`}>Inactif</span></td>
                        <td>2026-03-05</td>
                      </tr>
                      <tr>
                        <td>
                          <div className={s.userCell}>
                            <div className={s.userAvatar} style={{background: '#e8f5e9', color: '#2e7d32'}}>S</div>
                            <span className={s.userName}>Sarah Bennani</span>
                          </div>
                        </td>
                        <td>sarah.b@email.com</td>
                        <td>0645678901</td>
                        <td><span className={`${s.badge} ${s.badgeActive}`}>Actif</span></td>
                        <td>2026-03-20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'universities' ? (
            <div className={s.universitiesContainer}>
              <div className={s.usersHeader}>
                <div>
                  <h1 className={s.pageTitle}>Gestion des universités</h1>
                  <p className={s.pageSubtitle}>Gérer les établissements d'enseignement supérieur</p>
                </div>
                <button className={s.btnPrimary}>+ Nouvelle université</button>
              </div>

              <div className={s.tableCard} style={{marginBottom: '20px'}}>
                <div className={s.tableToolbar}>
                  <div className={s.searchBarOutline}>
                    <svg className={s.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Rechercher une université..." />
                  </div>
                </div>
              </div>

              <div className={s.univGrid}>
                {/* Card 1 */}
                <div className={s.univCard}>
                  <div className={s.univCardTop}>
                    <div className={s.univIconBox}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className={s.univActions}>
                      <button className={s.actionBtn}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button className={s.actionBtn} style={{color: '#ef4444'}}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <h3 className={s.univName}>Université Hassan II</h3>
                  <div className={s.univLoc}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Casablanca
                  </div>
                  <div className={s.univLabel}>Spécialités:</div>
                  <div className={s.tagRow}>
                    <span className={s.univTag}>Sciences</span>
                    <span className={s.univTag}>Médecine</span>
                    <span className={s.univTag}>Lettres</span>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Critères d'admission:</div>
                    <div className={s.univVal}>Bac {'>'}= 12/20</div>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Étudiants:</div>
                    <div className={s.univVal}>45 000</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className={s.univCard}>
                  <div className={s.univCardTop}>
                    <div className={s.univIconBox}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className={s.univActions}>
                      <button className={s.actionBtn}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button className={s.actionBtn} style={{color: '#ef4444'}}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <h3 className={s.univName}>Université Mohammed V</h3>
                  <div className={s.univLoc}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Rabat
                  </div>
                  <div className={s.univLabel}>Spécialités:</div>
                  <div className={s.tagRow}>
                    <span className={s.univTag}>Droit</span>
                    <span className={s.univTag}>Économie</span>
                    <span className={s.univTag}>Ingénierie</span>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Critères d'admission:</div>
                    <div className={s.univVal}>Bac {'>'}= 13/20</div>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Étudiants:</div>
                    <div className={s.univVal}>38 000</div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className={s.univCard}>
                  <div className={s.univCardTop}>
                    <div className={s.univIconBox}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className={s.univActions}>
                      <button className={s.actionBtn}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button className={s.actionBtn} style={{color: '#ef4444'}}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <h3 className={s.univName}>Université Cadi Ayyad</h3>
                  <div className={s.univLoc}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Marrakech
                  </div>
                  <div className={s.univLabel}>Spécialités:</div>
                  <div className={s.tagRow}>
                    <span className={s.univTag}>Sciences</span>
                    <span className={s.univTag}>Lettres</span>
                    <span className={s.univTag}>Sciences Humaines</span>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Critères d'admission:</div>
                    <div className={s.univVal}>Bac {'>'}= 11/20</div>
                  </div>
                  <div className={s.univInfoRow}>
                    <div className={s.univLabel}>Étudiants:</div>
                    <div className={s.univVal}>32 000</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'backup' ? (
            <div className={s.backupContainer}>
              <h1 className={s.pageTitle}>Sauvegarde & Restauration</h1>
              <p className={s.pageSubtitle}>Gérer les sauvegardes de la base de données</p>

              <div className={s.backupGrid}>
                {/* Create Backup Card */}
                <div className={s.backupMainCard}>
                  <div className={s.backupCardHeader}>
                    <div className={s.backupIconBox} style={{background: '#f0fdf4', color: '#16a34a'}}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                      <h3 className={s.backupCardTitle}>Créer une sauvegarde</h3>
                      <p className={s.backupCardSubtitle}>Sauvegarder toutes les données</p>
                    </div>
                  </div>

                  <div className={s.backupInfoBox}>
                    <div className={s.backupInfoRow}>
                      <span>Dernière sauvegarde:</span>
                      <span className={s.bold}>2026-04-20</span>
                    </div>
                    <div className={s.backupInfoRow}>
                      <span>Taille:</span>
                      <span className={s.bold}>2.5 MB</span>
                    </div>
                  </div>

                  <button className={s.btnPrimary} style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Créer une sauvegarde
                  </button>
                  <p className={s.backupFooterNote}>La sauvegarde inclut tous les utilisateurs et universités</p>
                </div>

                {/* Restore Backup Card */}
                <div className={s.backupMainCard}>
                  <div className={s.backupCardHeader}>
                    <div className={s.backupIconBox} style={{background: '#f0f9ff', color: '#0284c7'}}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" /></svg>
                    </div>
                    <div>
                      <h3 className={s.backupCardTitle}>Restaurer une sauvegarde</h3>
                      <p className={s.backupCardSubtitle}>Récupérer des données précédentes</p>
                    </div>
                  </div>

                  <div className={s.backupWarningBox}>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{flexShrink: 0}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <div>
                        <span style={{fontWeight: 700, display: 'block', marginBottom: '4px'}}>Attention</span>
                        <p style={{fontSize: '13px', margin: 0, opacity: 0.8}}>La restauration remplacera toutes les données actuelles par celles de la sauvegarde sélectionnée.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className={s.historySection} style={{marginTop: '32px'}}>
                <h2 className={s.sectionTitle} style={{fontSize: '18px', marginBottom: '16px'}}>Historique des sauvegardes</h2>
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
                        <tr>
                          <td>2026-04-20</td>
                          <td>14:30</td>
                          <td>2.5 MB</td>
                          <td><span className={`${s.badge} ${s.badgeActive}`}>Terminé</span></td>
                          <td>
                            <div className={s.univActions}>
                              <button className={s.actionBtn} title="Télécharger"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                              <button className={s.actionBtn} style={{color: '#ef4444'}} title="Supprimer"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>2026-04-15</td>
                          <td>09:15</td>
                          <td>2.3 MB</td>
                          <td><span className={`${s.badge} ${s.badgeActive}`}>Terminé</span></td>
                          <td>
                            <div className={s.univActions}>
                              <button className={s.actionBtn}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                              <button className={s.actionBtn} style={{color: '#ef4444'}}><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
