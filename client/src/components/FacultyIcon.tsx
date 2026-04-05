import type { FacultyIcon } from '../data/faculties'

interface Props { icon: FacultyIcon }

export default function FacultyIconSvg({ icon }: Props) {
  switch (icon) {

    /* ── 1. Génie Électrique – microchip board ───────────────── */
    case 'chip': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* PCB board */}
        <rect x="8" y="14" width="44" height="32" rx="4" fill="#4CAF50" opacity=".9"/>
        <rect x="10" y="16" width="40" height="28" rx="3" fill="#388E3C"/>
        {/* chip center */}
        <rect x="19" y="22" width="22" height="16" rx="3" fill="#1565C0"/>
        <rect x="21" y="24" width="18" height="12" rx="2" fill="#1976D2"/>
        <rect x="23" y="26" width="14" height="8" rx="1" fill="#42A5F5"/>
        {/* chip label */}
        <rect x="25" y="28" width="10" height="4" rx="1" fill="#0D47A1" opacity=".8"/>
        {/* left pins */}
        <rect x="4" y="22" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        <rect x="4" y="27" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        <rect x="4" y="32" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        {/* right pins */}
        <rect x="51" y="22" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        <rect x="51" y="27" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        <rect x="51" y="32" width="5" height="2.5" rx="1" fill="#B0BEC5"/>
        {/* top pins */}
        <rect x="22" y="10" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        <rect x="28" y="10" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        <rect x="34" y="10" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        {/* bottom pins */}
        <rect x="22" y="45" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        <rect x="28" y="45" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        <rect x="34" y="45" width="2.5" height="5" rx="1" fill="#B0BEC5"/>
        {/* circuit traces */}
        <line x1="14" y1="20" x2="19" y2="24" stroke="#66BB6A" strokeWidth="1.2"/>
        <line x1="46" y1="20" x2="41" y2="24" stroke="#66BB6A" strokeWidth="1.2"/>
        <line x1="14" y1="40" x2="19" y2="36" stroke="#66BB6A" strokeWidth="1.2"/>
        <line x1="46" y1="40" x2="41" y2="36" stroke="#66BB6A" strokeWidth="1.2"/>
        {/* small component dots */}
        <circle cx="15" cy="28" r="2" fill="#FF9800"/>
        <circle cx="45" cy="28" r="2" fill="#FF9800"/>
        <circle cx="30" cy="18" r="2" fill="#FF5722"/>
        <circle cx="30" cy="42" r="2" fill="#FF5722"/>
      </svg>
    )

    /* ── 2. Médecine – caduceus / medical cross ──────────────── */
    case 'caduceus': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* staff */}
        <rect x="28" y="6" width="4" height="48" rx="2" fill="#B0BEC5"/>
        {/* snakes */}
        <path d="M30 12 C22 14 20 20 26 23 C32 26 36 22 30 19 C24 16 20 23 24 28 C28 33 36 31 34 37 C32 43 24 43 22 48" stroke="#4CAF50" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M30 12 C38 14 40 20 34 23 C28 26 24 22 30 19 C36 16 40 23 36 28 C32 33 24 31 26 37 C28 43 36 43 38 48" stroke="#81C784" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* wings */}
        <path d="M30 11 C26 8 18 9 16 13 C20 12 24 13 30 11Z" fill="#29B6F6"/>
        <path d="M30 11 C34 8 42 9 44 13 C40 12 36 13 30 11Z" fill="#29B6F6"/>
        {/* top orb */}
        <circle cx="30" cy="10" r="4" fill="#F44336"/>
        <circle cx="30" cy="10" r="2" fill="#FF8A80"/>
        {/* medical cross overlay */}
        <rect x="26" y="26" width="8" height="2.5" rx="1" fill="white" opacity=".6"/>
        <rect x="28.75" y="23.75" width="2.5" height="8" rx="1" fill="white" opacity=".6"/>
      </svg>
    )

    /* ── 3. Sciences Économiques – bar chart + coin ──────────── */
    case 'book': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* background */}
        <rect x="6" y="8" width="48" height="44" rx="6" fill="#E3F2FD"/>
        {/* bar chart bars */}
        <rect x="13" y="30" width="8" height="16" rx="2" fill="#1976D2"/>
        <rect x="24" y="22" width="8" height="24" rx="2" fill="#F47920"/>
        <rect x="35" y="26" width="8" height="20" rx="2" fill="#4CAF50"/>
        {/* baseline */}
        <line x1="10" y1="47" x2="50" y2="47" stroke="#90A4AE" strokeWidth="1.5"/>
        {/* coin */}
        <circle cx="44" cy="16" r="9" fill="#FFC107"/>
        <circle cx="44" cy="16" r="7" fill="#FFD54F"/>
        <text x="44" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#E65100">$</text>
        {/* trend arrow */}
        <polyline points="13,36 24,28 35,32 46,20" stroke="#F44336" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="46,20 42,21 44,25" fill="#F44336"/>
      </svg>
    )

    /* ── 4. Génie / Sciences appliquées – microscope ─────────── */
    case 'gear': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* base */}
        <rect x="14" y="48" width="32" height="5" rx="2.5" fill="#78909C"/>
        <rect x="22" y="44" width="16" height="6" rx="2" fill="#90A4AE"/>
        {/* arm vertical */}
        <rect x="27" y="20" width="6" height="26" rx="3" fill="#B0BEC5"/>
        {/* arm horizontal */}
        <rect x="27" y="20" width="18" height="5" rx="2.5" fill="#90A4AE"/>
        {/* eyepiece */}
        <rect x="26" y="10" width="8" height="14" rx="4" fill="#546E7A"/>
        <rect x="28" y="12" width="4" height="10" rx="2" fill="#78909C"/>
        <circle cx="30" cy="12" r="3" fill="#37474F"/>
        <circle cx="30" cy="12" r="1.5" fill="#607D8B"/>
        {/* objective lens */}
        <rect x="27" y="34" width="6" height="8" rx="3" fill="#455A64"/>
        <circle cx="30" cy="41" r="3" fill="#263238"/>
        <circle cx="30" cy="41" r="1.5" fill="#37474F"/>
        {/* light beam */}
        <path d="M27 42 L20 52 L40 52 L33 42Z" fill="#FFF9C4" opacity=".7"/>
        {/* stage */}
        <rect x="18" y="44" width="24" height="2" rx="1" fill="#78909C"/>
        {/* light circle on stage */}
        <ellipse cx="30" cy="45" rx="6" ry="1.5" fill="#FFF176" opacity=".8"/>
      </svg>
    )

    /* ── 5. Scienmiques – pie chart + analytics ──────────────── */
    case 'chart': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* background card */}
        <rect x="4" y="4" width="52" height="52" rx="8" fill="#F3E5F5"/>
        {/* pie chart */}
        <circle cx="22" cy="26" r="14" fill="#E1BEE7"/>
        {/* pie slices */}
        <path d="M22 26 L22 12 A14 14 0 0 1 36 26 Z" fill="#9C27B0"/>
        <path d="M22 26 L36 26 A14 14 0 0 1 22 40 Z" fill="#E91E63"/>
        <path d="M22 26 L22 40 A14 14 0 0 1 8 26 Z" fill="#FF9800"/>
        <path d="M22 26 L8 26 A14 14 0 0 1 22 12 Z" fill="#4CAF50"/>
        <circle cx="22" cy="26" r="5" fill="white"/>
        {/* dollar coin */}
        <circle cx="44" cy="20" r="10" fill="#FFC107"/>
        <circle cx="44" cy="20" r="8" fill="#FFD54F"/>
        <text x="44" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#E65100">$</text>
        {/* mini bars */}
        <rect x="36" y="38" width="5" height="10" rx="1.5" fill="#9C27B0" opacity=".7"/>
        <rect x="43" y="34" width="5" height="14" rx="1.5" fill="#E91E63" opacity=".7"/>
        <rect x="50" y="40" width="5" height="8" rx="1.5" fill="#FF9800" opacity=".7"/>
        <line x1="34" y1="49" x2="57" y2="49" stroke="#B0BEC5" strokeWidth="1.2"/>
      </svg>
    )

    /* ── 6. Artc ras / Géologie – rainbow compass wheel ─────── */
    case 'compass': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* outer ring segments */}
        <circle cx="30" cy="30" r="24" fill="#F5F5F5"/>
        {/* colored arc segments — rainbow wheel */}
        <path d="M30 30 L30 6 A24 24 0 0 1 54 30 Z" fill="#F44336" opacity=".85"/>
        <path d="M30 30 L54 30 A24 24 0 0 1 30 54 Z" fill="#FF9800" opacity=".85"/>
        <path d="M30 30 L30 54 A24 24 0 0 1 6 30 Z"  fill="#4CAF50" opacity=".85"/>
        <path d="M30 30 L6 30 A24 24 0 0 1 30 6 Z"   fill="#2196F3" opacity=".85"/>
        {/* inner decorative ring */}
        <circle cx="30" cy="30" r="16" fill="white"/>
        <circle cx="30" cy="30" r="14" fill="#ECEFF1"/>
        {/* small colored dots on inner ring */}
        <circle cx="30" cy="18" r="2.5" fill="#F44336"/>
        <circle cx="42" cy="30" r="2.5" fill="#FF9800"/>
        <circle cx="30" cy="42" r="2.5" fill="#4CAF50"/>
        <circle cx="18" cy="30" r="2.5" fill="#2196F3"/>
        {/* spokes */}
        <line x1="30" y1="20" x2="30" y2="16" stroke="#90A4AE" strokeWidth="1.5"/>
        <line x1="30" y1="40" x2="30" y2="44" stroke="#90A4AE" strokeWidth="1.5"/>
        <line x1="20" y1="30" x2="16" y2="30" stroke="#90A4AE" strokeWidth="1.5"/>
        <line x1="40" y1="30" x2="44" y2="30" stroke="#90A4AE" strokeWidth="1.5"/>
        {/* center hub */}
        <circle cx="30" cy="30" r="5" fill="#37474F"/>
        <circle cx="30" cy="30" r="3" fill="#78909C"/>
        <circle cx="30" cy="30" r="1.5" fill="#CFD8DC"/>
        {/* magnifier overlay */}
        <circle cx="46" cy="46" r="9" fill="white" stroke="#90A4AE" strokeWidth="1.5" fillOpacity=".9"/>
        <circle cx="46" cy="46" r="6" fill="none" stroke="#B0BEC5" strokeWidth="1"/>
        <line x1="50" y1="50" x2="54" y2="54" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )

    /* ── 7. Arts & Design – telescope ───────────────────────── */
    case 'microscope': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* tripod legs */}
        <line x1="30" y1="42" x2="16" y2="56" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="42" x2="44" y2="56" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="42" x2="30" y2="56" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
        {/* telescope body — angled tube */}
        <rect x="10" y="22" width="40" height="12" rx="6" fill="#5C6BC0" transform="rotate(-25 30 28)"/>
        <rect x="12" y="24" width="36" height="8"  rx="4" fill="#7986CB" transform="rotate(-25 30 28)"/>
        {/* eyepiece end */}
        <ellipse cx="14" cy="36" rx="5" ry="6" fill="#3949AB" transform="rotate(-25 14 36)"/>
        <ellipse cx="14" cy="36" rx="3" ry="4" fill="#283593" transform="rotate(-25 14 36)"/>
        {/* objective lens end */}
        <ellipse cx="46" cy="20" rx="6" ry="7" fill="#7E57C2" transform="rotate(-25 46 20)"/>
        <ellipse cx="46" cy="20" rx="4" ry="5" fill="#311B92" transform="rotate(-25 46 20)"/>
        {/* lens gleam */}
        <circle cx="44" cy="17" r="2" fill="#B39DDB" opacity=".6"/>
        {/* star sparkle near lens */}
        <circle cx="52" cy="10" r="2" fill="#FFF176"/>
        <line x1="52" y1="6" x2="52" y2="14" stroke="#FFF176" strokeWidth="1.2"/>
        <line x1="48" y1="10" x2="56" y2="10" stroke="#FFF176" strokeWidth="1.2"/>
        {/* mounting collar */}
        <rect x="26" y="24" width="8" height="8" rx="2" fill="#3F51B5" transform="rotate(-25 30 28)"/>
      </svg>
    )

    /* ── 8. Arts & Lettres – pen / writing ───────────────────── */
    case 'pen': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* notebook */}
        <rect x="8" y="10" width="36" height="46" rx="4" fill="#FFF8E1"/>
        <rect x="8" y="10" width="6" height="46" rx="4" fill="#FFE082"/>
        {/* notebook lines */}
        <line x1="18" y1="22" x2="40" y2="22" stroke="#BCAAA4" strokeWidth="1.2"/>
        <line x1="18" y1="28" x2="40" y2="28" stroke="#BCAAA4" strokeWidth="1.2"/>
        <line x1="18" y1="34" x2="40" y2="34" stroke="#BCAAA4" strokeWidth="1.2"/>
        <line x1="18" y1="40" x2="34" y2="40" stroke="#BCAAA4" strokeWidth="1.2"/>
        {/* spiral binding */}
        <circle cx="11" cy="18" r="2.5" fill="none" stroke="#90A4AE" strokeWidth="1.5"/>
        <circle cx="11" cy="28" r="2.5" fill="none" stroke="#90A4AE" strokeWidth="1.5"/>
        <circle cx="11" cy="38" r="2.5" fill="none" stroke="#90A4AE" strokeWidth="1.5"/>
        <circle cx="11" cy="48" r="2.5" fill="none" stroke="#90A4AE" strokeWidth="1.5"/>
        {/* pen / marker */}
        <rect x="36" y="8" width="10" height="38" rx="5" fill="#F47920" transform="rotate(30 41 27)"/>
        <rect x="38" y="10" width="6" height="30" rx="3" fill="#FF8A65" transform="rotate(30 41 27)"/>
        {/* pen tip */}
        <polygon points="41,44 38,50 44,50" fill="#5D4037" transform="rotate(30 41 47)"/>
        <polygon points="41,48 39.5,51 42.5,51" fill="#FFD54F" transform="rotate(30 41 49)"/>
        {/* pen clip */}
        <rect x="42" y="9" width="2" height="22" rx="1" fill="#E64A19" transform="rotate(30 43 20)"/>
        {/* checkmark on paper */}
        <polyline points="20,30 23,34 30,26" stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )

    /* ── 9. Artsecique – artist palette + brushes ────────────── */
    case 'palette': return (
      <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
        {/* palette shape */}
        <path d="M30 8 C18 8 8 17 8 28 C8 36 14 42 22 44 C26 45 28 43 28 40 C28 38 27 36 27 34 C27 31 29 30 32 30 L38 30 C44 30 52 26 52 20 C52 13 42 8 30 8Z" fill="#FFF8E1" stroke="#FFE082" strokeWidth="1.5"/>
        {/* palette thumb hole */}
        <ellipse cx="18" cy="40" rx="4" ry="5" fill="#E0E0E0" opacity=".7"/>
        {/* paint blobs */}
        <circle cx="18" cy="16" r="4.5" fill="#F44336"/>
        <circle cx="27" cy="11" r="4.5" fill="#FFEB3B"/>
        <circle cx="37" cy="13" r="4.5" fill="#2196F3"/>
        <circle cx="44" cy="20" r="4.5" fill="#4CAF50"/>
        <circle cx="44" cy="30" r="4" fill="#9C27B0" opacity=".8"/>
        <circle cx="13" cy="26" r="4" fill="#FF9800" opacity=".8"/>
        {/* brushes */}
        <line x1="38" y1="38" x2="54" y2="22" stroke="#795548" strokeWidth="3" strokeLinecap="round"/>
        <rect x="36" y="36" width="5" height="7" rx="2" fill="#A1887F" transform="rotate(45 38 39)"/>
        <ellipse cx="37.5" cy="37.5" rx="2.5" ry="4" fill="#FF9800" transform="rotate(45 37.5 37.5)"/>

        <line x1="44" y1="46" x2="56" y2="34" stroke="#795548" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="44.5" cy="46.5" rx="2" ry="3.5" fill="#4CAF50" transform="rotate(45 44.5 46.5)"/>
        {/* sparkles */}
        <circle cx="10" cy="48" r="1.5" fill="#FFC107"/>
        <circle cx="50" cy="50" r="1.5" fill="#E91E63"/>
        <circle cx="54" cy="40" r="1" fill="#29B6F6"/>
      </svg>
    )

    default: return null
  }
}
