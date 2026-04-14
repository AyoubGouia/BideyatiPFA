import type { Faculty } from '../data/faculties'
import { facultyMatchesSearch } from '../utils/etablissementList'
import FacultyCard from './FacultyCard'
import DomainVoirPlusCard from './DomainVoirPlusCard'
import s from './DomainEtablissementSection.module.css'

const PREVIEW = 5

interface Props {
  title: string
  faculties: Faculty[]
  loading: boolean
  error: boolean
  globalSearch: string
  onVoirPlus: () => void
  onFacultyDetails: (id: string) => void
}

export default function DomainEtablissementSection({
  title,
  faculties,
  loading,
  error,
  globalSearch,
  onVoirPlus,
  onFacultyDetails,
}: Props) {
  const filtered = faculties.filter((faculty) => facultyMatchesSearch(faculty, globalSearch))
  const slug = title.replace(/\W+/g, '-').replace(/^-+|-+$/g, '') || 'domain'

  return (
    <section className={s.section} aria-labelledby={`domain-${slug}`}>
      <div className={s.panel}>
        <h2 className={s.title} id={`domain-${slug}`}>
          {title}
        </h2>

        {loading && <p className={s.muted}>Chargement...</p>}
        {error && <p className={s.err}>Impossible de charger les etablissements pour ce domaine.</p>}

        {!loading && !error && faculties.length === 0 && (
          <>
            <p className={s.muted}>
              Aucun etablissement reel n'a ete trouve pour ce domaine. Vous pouvez
              ouvrir la vue complete ci-dessous.
            </p>
            <div className={`${s.grid} ${s.gridVoirPlusOnly}`}>
              <DomainVoirPlusCard onClick={onVoirPlus} />
            </div>
          </>
        )}

        {!loading && !error && faculties.length > 0 && (
          <>
            {filtered.length === 0 && globalSearch.trim() !== '' && (
              <p className={s.hint}>Aucun resultat dans ce domaine pour votre recherche.</p>
            )}
            <div className={s.grid}>
              {filtered.slice(0, PREVIEW).map((faculty) => (
                <FacultyCard
                  key={faculty.id}
                  faculty={faculty}
                  onDetails={() => onFacultyDetails(faculty.id)}
                />
              ))}
              <DomainVoirPlusCard onClick={onVoirPlus} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
