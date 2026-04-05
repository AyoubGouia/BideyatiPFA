# BideyatiPFA

## Testing environment (Sprint 1)

This project now includes a full local integration testing setup for all Sprint 1 APIs:
- `GET /api/home`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/profile`
- `POST /api/questionnaire`

### 1) Start test database and prepare schema/data

From `Server/`:

```bash
npm run test:prepare
```

This will:
- start PostgreSQL test DB (`docker-compose.test.yml`)
- apply Prisma migrations
- seed reference data (`Matiere`, `Universite`)

### 2) Run integration tests

```bash
npm run test:integration
```

or run everything in one command:

```bash
npm run test:all
```

### If Docker is not available

You can run tests against the current `.env` database:

```bash
npm run test:prepare:current
npm run test:integration:current
```

### 3) Stop and clean test DB

```bash
npm run test:db:down
```

## Postman quick import

Import these files in Postman:
- `postman/Bideyati_Sprint1.postman_collection.json` (full set including health)
- `postman/Bideyati_Sprint1_New_Endpoints.postman_collection.json` (Sprint 1 + universités/établissements)
- `postman/Bideyati_Universites_Etablissements.postman_collection.json` (only `UniversiteController` + `EtablissementController` routes)
- `postman/Bideyati_Local.postman_environment.json`

Then select the `Bideyati Local` environment and run requests in order:
1. Health
2. Home (Public)
3. Register
4. Login
5. Profile (Protected)
6. Questionnaire (Protected)
7. Logout
8. Profile After Logout (Should 401)