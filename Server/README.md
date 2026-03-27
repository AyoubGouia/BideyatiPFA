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