import { useEffect, useState } from "react";
import type { Page } from "../App";
import { useAuth } from "../context/AuthContext";
import s from "./UniversityPage.module.css";
import BideyetiLogo from "../components/BideyetiLogo";
import type { Faculty } from "../data/faculties";
import { etablissementApi } from "../api/etablissementApi";
import { specialiteApi } from "../api/specialiteApi";
import {
  facultyMatchesSearch,
  mergeEtablissementsWithSpecialites,
} from "../utils/etablissementList";
import FacultyCard from "../components/FacultyCard";
import EducationLoader from "../components/EducationLoader";

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void;
  domainLabel: string;
  searchQueries: string[];
}

export default function DomainEtablissementsPage({
  nav,
  domainLabel,
  searchQueries,
}: Props) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [etabs, specs] = await Promise.all([
          etablissementApi.searchByQueriesMerged(searchQueries),
          specialiteApi.getAll().catch(() => []),
        ]);
        if (!cancelled) {
          setFaculties(mergeEtablissementsWithSpecialites(etabs, specs));
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setFaculties([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQueries]);

  const filtered = faculties.filter((faculty) =>
    facultyMatchesSearch(faculty, search),
  );

  const handleLogout = async () => {
    await logout();
    nav("home");
  };

  const backToBrowse = () => nav(user ? "university" : "visitor");

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div
          className={s.logoWrap}
          onClick={backToBrowse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && backToBrowse()}
          aria-label="Retour a l'exploration"
        >
          <BideyetiLogo />
        </div>

        <div className={s.headerBtns}>
          {user && (
            <div className={s.userBadge}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{user.prenom || "Etudiant"}</span>
            </div>
          )}
          <button type="button" className={s.btnHdr} onClick={handleLogout}>
            Se deconnecter
          </button>
        </div>
      </header>

      <main className={s.main}>
        <button type="button" className={s.backLink} onClick={backToBrowse}>
          {"<-"} Retour a la liste par domaine
        </button>

        <h1 className={s.title}>{domainLabel}</h1>

        <div className={s.navigationOptions}>
          <button
            type="button"
            className={s.regionBtn}
            onClick={() => nav("region")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Explorer par region
          </button>
          <div className={s.divider}>ou</div>
          <button
            type="button"
            className={s.specialityBtn}
            onClick={() => nav(user ? "speciality" : "register")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Explorer par specialite
          </button>
        </div>

        <div className={s.searchRow}>
          <div className={s.searchBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aab5be"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un etablissement ou une specialite..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher"
            />
          </div>
        </div>

        {isLoading && (
          <EducationLoader
            compact
            label={`Chargement de ${domainLabel}`}
            caption="Preparation de la liste complete des etablissements."
          />
        )}
        {loadError && !isLoading && (
          <p className={s.empty}>Impossible de charger les etablissements.</p>
        )}
        {!isLoading && !loadError && faculties.length === 0 && (
          <p className={s.empty}>Aucun etablissement pour ce domaine.</p>
        )}
        {!isLoading &&
          !loadError &&
          faculties.length > 0 &&
          filtered.length === 0 && (
            <p className={s.empty}>
              Aucun etablissement ne correspond a votre recherche.
            </p>
          )}
        {!isLoading && !loadError && filtered.length > 0 && (
          <div className={s.grid}>
            {filtered.map((faculty) => (
              <FacultyCard
                key={faculty.id}
                faculty={faculty}
                onDetails={() => nav("faculty-detail", undefined, faculty.id)}
              />
            ))}
          </div>
        )}

        <footer className={s.footer}>
          (c) 2026 Bideyety | Tous droits reserves.
        </footer>
      </main>
    </div>
  );
}
