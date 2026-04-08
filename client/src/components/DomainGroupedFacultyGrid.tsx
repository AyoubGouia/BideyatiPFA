import { useMemo, useState } from 'react'
import type { Faculty } from '../data/faculties'
import FacultyCard from './FacultyCard'
import {
  facultyMatchesSearch,
  groupFacultiesByDomain,
  sortDomainKeys,
} from '../utils/etablissementList'
import s from './DomainGroupedFacultyGrid.module.css'

const PREVIEW_COUNT = 5

interface Props {
  faculties: Faculty[]
  search: string
  isLoading: boolean
  loadingText: string
  emptyText: string
  onFacultyDetails: (facultyId: string) => void
}

export default function DomainGroupedFacultyGrid({
  faculties,
  search,
  isLoading,
  loadingText,
  emptyText,
  onFacultyDetails,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(
    () => faculties.filter(f => facultyMatchesSearch(f, search)),
    [faculties, search]
  )

  const byDomain = useMemo(() => groupFacultiesByDomain(filtered), [filtered])
  const domainKeys = useMemo(() => sortDomainKeys([...byDomain.keys()]), [byDomain])

  if (isLoading) {
    return <p className={s.empty}>{loadingText}</p>
  }

  if (filtered.length === 0) {
    return <p className={s.empty}>{emptyText}</p>
  }

  return (
    <>
      {domainKeys.map(domain => {
        const list = byDomain.get(domain)!
        const showAll = expanded[domain]
        const visible = showAll ? list : list.slice(0, PREVIEW_COUNT)
        return (
          <section key={domain} className={s.domainSection}>
            <h2 className={s.domainTitle}>{domain}</h2>
            <div className={s.grid}>
              {visible.map(fac => (
                <FacultyCard
                  key={fac.id}
                  faculty={fac}
                  onDetails={() => onFacultyDetails(fac.id)}
                />
              ))}
            </div>
            {list.length > PREVIEW_COUNT && (
              <div className={s.voirPlusRow}>
                <button
                  type="button"
                  className={s.btnVoirPlus}
                  onClick={() =>
                    setExpanded(prev => ({ ...prev, [domain]: !showAll }))
                  }
                >
                  {showAll
                    ? 'Voir moins'
                    : `Voir plus (${list.length - PREVIEW_COUNT} autres)`}
                </button>
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
