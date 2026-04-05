# Bideyety – Full Project (Homepage + Visitor Page)

React 18 + TypeScript + Vite + CSS Modules.

---

## Folder structure

```
bideyety/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── src/
    ├── main.tsx                      ← ReactDOM entry
    ├── App.tsx                       ← State-based router (home | visitor)
    ├── index.css                     ← Global reset + CSS custom properties
    ├── vite-env.d.ts                 ← *.png type declarations
    │
    ├── assets/
    │   ├── bg-home.png               ← Homepage full-screen background
    │   └── logo.png                  ← Bideyety logo (visitor page header)
    │
    ├── data/
    │   └── faculties.ts              ← 9 faculties + filter tabs data
    │
    ├── components/
    │   ├── FacultyIcon.tsx           ← 9 custom SVG icons (chip, caduceus…)
    │   ├── FacultyCard.tsx           ← Reusable faculty card component
    │   └── FacultyCard.module.css
    │
    └── pages/
        ├── HomePage.tsx              ← Homepage with background + CTA button
        ├── HomePage.module.css
        ├── VisitorPage.tsx           ← Faculty explorer with search + filters
        └── VisitorPage.module.css
```

---

## Run locally

```bash
# Requires Node.js ≥ 18
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

---

## Navigation (how pages are linked)

```
HomePage  ──[Commencer en tant que visiteur]──▶  VisitorPage
VisitorPage  ──[logo click]──▶  HomePage
```

Implemented in `App.tsx` via `useState<'home' | 'visitor'>`:

```tsx
// App.tsx
const [page, setPage] = useState<Page>('home')
const nav = (p: Page) => { setPage(p); window.scrollTo(0, 0) }

return (
  <>
    {page === 'home'    && <HomePage    nav={nav} />}
    {page === 'visitor' && <VisitorPage nav={nav} />}
  </>
)
```

The button in `HomePage.tsx`:
```tsx
<button className={s.cta} onClick={() => nav('visitor')}>
  Commencer en tant que visiteur
</button>
```

---

## Components

| Component | Description |
|---|---|
| `HomePage` | Full-screen bg image, top-right pills, tagline + CTA |
| `VisitorPage` | Sticky header, search, filter tabs, 3-col card grid |
| `FacultyCard` | White card with name, subtitle, SVG icon, orange button |
| `FacultyIcon` | 9 hand-crafted SVG icons matching the design exactly |

---

## Data

All faculty data lives in `src/data/faculties.ts` — easy to extend:

```ts
export const FACULTIES: Faculty[] = [
  { name: 'Faculté de Génie Électrique', sub: 'Ingénierie & Technologie',
    cat: 'Génie', icon: 'chip' },
  // … 8 more
]
```
