import type { Etablissement } from '../api/etablissementApi'

export interface Faculty {
  id: string
  name: string
  sub: string
  cat: string   // used for filter matching
  icon: FacultyIcon
  description: string
  programs: string[]
  admission: string
  duration: string
  location: string
  region: string
  specialities: string[]
  website?: string
  email?: string
  phone?: string
}

export interface Region {
  id: string
  name: string
  description: string
  cities: string[]
  faculties: string[] // faculty IDs
}

export interface Speciality {
  id: string
  name: string
  category: string
  description: string
  faculties: string[] // faculty IDs
}

export type FacultyIcon =
  | 'chip'
  | 'caduceus'
  | 'book'
  | 'gear'
  | 'chart'
  | 'compass'
  | 'microscope'
  | 'pen'
  | 'palette'

export function mapEtablissementToFaculty(e: Etablissement): Faculty {
  return {
    id: e.id,
    name: e.nom,
    sub: e.type || "Établissement Universitaire",
    cat: e.type || "Général",
    icon: (e.type?.toLowerCase().includes('ingénieur') || e.type?.toLowerCase().includes('technologie')) ? 'chip' 
        : e.type?.toLowerCase().includes('médecine') ? 'caduceus'
        : e.type?.toLowerCase().includes('commerce') ? 'book'
        : 'chip',
    description: `Établissement situé à ${e.gouvernorat}. Plus de détails à venir.`,
    programs: [],
    admission: "Sur dossier / Concours",
    duration: "3 à 5 ans",
    location: `${e.gouvernorat}, Tunisie`,
    region: e.gouvernorat || "Tunisie",
    specialities: [],
    website: e.website
  }
}

/** Données complètes des facultés avec informations détaillées */
export const FACULTIES: Faculty[] = [
  {
    id: 'genie-electrique',
    name: 'Faculté de Génie Électrique',
    sub: 'Ingénierie & Technologie',
    cat: 'Génie',
    icon: 'chip',
    description: 'La Faculté de Génie Électrique forme des ingénieurs spécialisés dans les systèmes électriques, l\'électronique et les télécommunications. Nos programmes combinent théorie avancée et pratique industrielle.',
    programs: ['Génie Électrique', 'Électronique', 'Télécommunications', 'Automatique', 'Énergie Renouvelable'],
    admission: 'Baccalauréat Math, Technique ou Sciences avec mention Bien',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Électrotechnique', 'Électronique', 'Télécommunications', 'Automatique', 'Énergie'],
    website: 'https://genie-electrique.utm.tn',
    email: 'contact@genie-electrique.utm.tn',
    phone: '+216 71 874 200'
  },
  {
    id: 'medecine',
    name: 'Faculté de Médecine',
    sub: 'Médecine',
    cat: 'Santé',
    icon: 'caduceus',
    description: 'La Faculté de Médecine est l\'une des plus prestigieuses institutions médicales de Tunisie, formant les médecins de demain avec une approche moderne et humaniste de la santé.',
    programs: ['Médecine Générale', 'Chirurgie', 'Pédiatrie', 'Cardiologie', 'Neurologie'],
    admission: 'Baccalauréat Sciences avec mention Très Bien + Concours national',
    duration: '7 ans (Doctorat en Médecine)',
    location: 'Hôpital Charles Nicolle, Tunis',
    region: 'Tunis',
    specialities: ['Médecine Générale', 'Chirurgie', 'Pédiatrie', 'Cardiologie', 'Neurologie'],
    website: 'https://medecine.utm.tn',
    email: 'info@medecine.utm.tn',
    phone: '+216 71 560 200'
  },
  {
    id: 'sciences-economiques',
    name: 'Faculté des Sciences Économiques',
    sub: 'Ingénierie & Commerce',
    cat: 'Commerce',
    icon: 'book',
    description: 'La Faculté des Sciences Économiques prépare les étudiants aux défis du monde économique moderne avec des programmes en gestion, finance et économie.',
    programs: ['Économie', 'Gestion', 'Finance', 'Marketing', 'Commerce International'],
    admission: 'Baccalauréat Économie, Math ou Sciences',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Économie', 'Gestion', 'Finance', 'Marketing', 'Commerce'],
    website: 'https://fsegt.utm.tn',
    email: 'contact@fsegt.utm.tn',
    phone: '+216 71 874 700'
  },
  {
    id: 'informatique',
    name: 'Faculté d\'Informatique',
    sub: 'Ingénierie & Technologie',
    cat: 'Génie',
    icon: 'gear',
    description: 'La Faculté d\'Informatique forme des experts en technologies de l\'information, développement logiciel et intelligence artificielle pour répondre aux besoins du numérique.',
    programs: ['Informatique', 'Génie Logiciel', 'Intelligence Artificielle', 'Cybersécurité', 'Data Science'],
    admission: 'Baccalauréat Math, Technique ou Sciences',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Développement Logiciel', 'IA', 'Cybersécurité', 'Data Science', 'Réseaux'],
    website: 'https://informatique.utm.tn',
    email: 'contact@informatique.utm.tn',
    phone: '+216 71 874 300'
  },
  {
    id: 'sciences',
    name: 'Faculté des Sciences',
    sub: 'Ingénierie',
    cat: 'Sciences',
    icon: 'chart',
    description: 'La Faculté des Sciences offre une formation fondamentale en sciences expérimentales et théoriques, préparant aux carrières de la recherche et de l\'innovation.',
    programs: ['Physique', 'Chimie', 'Biologie', 'Mathématiques', 'Géologie'],
    admission: 'Baccalauréat Sciences ou Math',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Physique', 'Chimie', 'Biologie', 'Mathématiques', 'Géologie'],
    website: 'https://sciences.utm.tn',
    email: 'contact@sciences.utm.tn',
    phone: '+216 71 874 400'
  },
  {
    id: 'arts',
    name: 'Faculté des Arts',
    sub: 'Ingénierie & Géologie',
    cat: 'Sciences',
    icon: 'compass',
    description: 'La Faculté des Arts cultive la créativité et l\'expression artistique à travers des programmes en arts visuels, musique et théâtre.',
    programs: ['Arts Plastiques', 'Musique', 'Théâtre', 'Design Graphique', 'Histoire de l\'Art'],
    admission: 'Baccalauréat Lettres, Arts ou Sciences',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Arts Plastiques', 'Musique', 'Théâtre', 'Design', 'Histoire de l\'Art'],
    website: 'https://arts.utm.tn',
    email: 'contact@arts.utm.tn',
    phone: '+216 71 874 500'
  },
  {
    id: 'arts-design-1',
    name: 'Faculté des Arts & Design',
    sub: 'Ingénierie & Science',
    cat: 'Arts',
    icon: 'microscope',
    description: 'La Faculté des Arts & Design combine créativité et technologie pour former les designers de demain dans divers domaines.',
    programs: ['Design Industriel', 'Design de Mode', 'Architecture d\'Intérieur', 'Design UX/UI', 'Photographie'],
    admission: 'Baccalauréat Arts, Technique ou Sciences',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Design Industriel', 'Design de Mode', 'Architecture', 'UX/UI', 'Photographie'],
    website: 'https://arts-design.utm.tn',
    email: 'contact@arts-design.utm.tn',
    phone: '+216 71 874 600'
  },
  {
    id: 'arts-design-2',
    name: 'Faculté des Arts & Design',
    sub: 'Ingénierie & Design',
    cat: 'Arts',
    icon: 'pen',
    description: 'Spécialisée dans le design graphique et la communication visuelle, cette faculté prépare aux métiers créatifs de l\'industrie.',
    programs: ['Design Graphique', 'Communication Visuelle', 'Illustration', 'Animation 2D/3D', 'Web Design'],
    admission: 'Baccalauréat Arts ou Technique',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Design Graphique', 'Communication', 'Illustration', 'Animation', 'Web Design'],
    website: 'https://design-graphique.utm.tn',
    email: 'contact@design.utm.tn',
    phone: '+216 71 874 650'
  },
  {
    id: 'arts-artistique',
    name: 'Faculté Artistique',
    sub: 'Technologie',
    cat: 'Arts',
    icon: 'palette',
    description: 'La Faculté Artistique est dédiée aux arts appliqués et aux métiers créatifs, alliant tradition artisanale et technologies modernes.',
    programs: ['Arts Appliqués', 'Céramique', 'Textile', 'Art Numérique', 'Scénographie'],
    admission: 'Baccalauréat Arts ou Technique',
    duration: '3 ans (Licence) + 2 ans (Master)',
    location: 'Campus Universitaire El Manar, Tunis',
    region: 'Tunis',
    specialities: ['Arts Appliqués', 'Céramique', 'Textile', 'Art Numérique', 'Scénographie'],
    website: 'https://arts-artistique.utm.tn',
    email: 'contact@arts-artistique.utm.tn',
    phone: '+216 71 874 700'
  }
]

/** Données des régions tunisiennes */
export const REGIONS: Region[] = [
  {
    id: 'tunis',
    name: 'Tunis',
    description: 'Capitale de la Tunisie, centre universitaire majeur avec les plus prestigieuses institutions',
    cities: ['Tunis', 'Le Bardo', 'El Menzah', 'El Manar'],
    faculties: ['genie-electrique', 'medecine', 'sciences-economiques', 'informatique', 'sciences', 'arts', 'arts-design-1', 'arts-design-2', 'arts-artistique']
  },
  {
    id: 'sfax',
    name: 'Sfax',
    description: 'Deuxième ville universitaire de Tunisie, pôle économique et industriel',
    cities: ['Sfax', 'Sakiet Ezzit', 'Sakiet Eddaier'],
    faculties: []
  },
  {
    id: 'sousse',
    name: 'Sousse',
    description: 'Centre universitaire important sur la côte est, spécialisé dans le tourisme et la santé',
    cities: ['Sousse', 'Hammam Sousse', 'Kalaa Kebira'],
    faculties: []
  },
  {
    id: 'kairouan',
    name: 'Kairouan',
    description: 'Centre historique et universitaire avec spécialités en sciences humaines et droit',
    cities: ['Kairouan', 'Chebika', 'Haffouz'],
    faculties: []
  },
  {
    id: 'bizerte',
    name: 'Bizerte',
    description: 'Port stratégique avec facultés spécialisées dans les sciences marines et l\'ingénierie',
    cities: ['Bizerte', 'Menzel Bourguiba', 'Mateur'],
    faculties: []
  },
  {
    id: 'monastir',
    name: 'Monastir',
    description: 'Pôle médical et technologique avec des facultés de médecine et d\'ingénierie avancées',
    cities: ['Monastir', 'Skanes', 'Ksar Hellal'],
    faculties: []
  },
  {
    id: 'gabes',
    name: 'Gabes',
    description: 'Centre industriel et chimique avec des facultés spécialisées en génie chimique',
    cities: ['Gabes', 'Mareth', 'El Hamma'],
    faculties: []
  },
  {
    id: 'ariana',
    name: 'Ariana',
    description: 'Région universitaire moderne avec facultés de droit et de gestion',
    cities: ['Ariana', 'La Soukra', 'Raoued'],
    faculties: []
  },
  {
    id: 'ben-arous',
    name: 'Ben Arous',
    description: 'Pôle industriel avec facultés techniques et professionnelles',
    cities: ['Ben Arous', 'Mégrine', 'Rades'],
    faculties: []
  },
  {
    id: 'nabeul',
    name: 'Nabeul',
    description: 'Centre touristique avec facultés spécialisées dans le tourisme et l\'artisanat',
    cities: ['Nabeul', 'Hammamet', 'Kélibia'],
    faculties: []
  }
]

/** Données des spécialités organisées par catégorie */
export const SPECIALITIES: Speciality[] = [
  {
    id: 'genie-electrique-specialities',
    name: 'Génie Électrique',
    category: 'Génie',
    description: 'Spécialités en électrotechnique, électronique et télécommunications',
    faculties: ['genie-electrique']
  },
  {
    id: 'informatique-specialities',
    name: 'Informatique',
    category: 'Génie',
    description: 'Développement logiciel, intelligence artificielle et cybersécurité',
    faculties: ['informatique']
  },
  {
    id: 'medecine-specialities',
    name: 'Médecine',
    category: 'Santé',
    description: 'Spécialités médicales et chirurgicales',
    faculties: ['medecine']
  },
  {
    id: 'sciences-economiques-specialities',
    name: 'Sciences Économiques',
    category: 'Commerce',
    description: 'Économie, gestion, finance et marketing',
    faculties: ['sciences-economiques']
  },
  {
    id: 'sciences-fondamentales',
    name: 'Sciences Fondamentales',
    category: 'Sciences',
    description: 'Physique, chimie, biologie et mathématiques',
    faculties: ['sciences']
  },
  {
    id: 'arts-design-specialities',
    name: 'Arts & Design',
    category: 'Arts',
    description: 'Design graphique, arts plastiques et communication visuelle',
    faculties: ['arts', 'arts-design-1', 'arts-design-2', 'arts-artistique']
  }
]

export const FILTER_TABS = ['Génie', 'Santé', 'Commerce', 'Arts', 'Sciences'] as const
export type FilterTab = (typeof FILTER_TABS)[number]
