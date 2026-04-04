# Bideyati Seed Script - Implementation Guide

## Assumptions Made

### Data Layer
1. **JSON files are colocated** at `data/` relative to `prisma/` directory:
   - `data/normalized/universites.json`
   - `data/normalized/etablissements.json`
   - `data/normalized/2023/scores_2023_reference.by_section.json`
   - `data/normalized/2024/scores_2024_reference.by_section.json`
   - `data/normalized/2025/scores_2025.by_section.json`
   - `data/normalized/2025/capacities_2025.by_section.json`
   - `data/normalized/specialties_base.cleaned.sample.json`

2. **Section names are hard-coded** - the 7 bac sections are known and invariant:
   ```
   آداب
   رياضيات
   علوم تجريبية
   إقتصاد وتصرف
   علوم الإعلامية
   العلوم التقنية
   رياضة
   ```

3. **codeOrientation is unique** - used as stable identifier across all data sources

4. **Establishment matching** - uses exact name match (case-insensitive) from extracted score/capacity files

5. **No fake fallback values** - when data cannot be resolved, fields are left null (not invented)

6. **specialties_base.json is canonical** - specialty name comes ONLY from this file, never overwritten

### Business Rules
1. **Idempotent seeding** - running twice produces same database state (uses upsert)
2. **Deduplication by row identity** - internal deduping to prevent duplicate inserts
3. **Unresolved entries are skipped** - not forced with nulls
4. **No cascade deletes to Specialite** - uses SetNull where possible to preserve data integrity

---

## Unresolved Edge Cases

### 1. Establishment Resolution Uncertainty
**Issue**: Extracted `establishment_name` may have minor variations (extra spaces, capitalization)
**Current approach**: Exact case-insensitive match on `etablissement.nom`
**Limitation**: If name varies significantly, etablissementId remains null
**Workaround**: Manual post-seed review of Specialite records with null etablissementId

### 2. Missing Establishment Records
**Issue**: A specialty code may appear in scores but establishment doesn't exist in `etablissements.json`
**Current approach**: Leave etablissementId null, log as "Unresolved"
**Impact**: Specialty still seeds correctly, just without institutional linkage
**Mitigation**: Check unresolved count after seed; manually fix if needed

### 3. Section Name Typos in Extracted Data
**Issue**: If extracted `sectionBac` has typo (e.g., "علوم تجريبيه" vs "علوم تجريبية")
**Current approach**: Exact match fails, row skipped, counted as "Unresolved"
**Workaround**: Pre-clean extracted JSON files OR add normalization after seed

### 4. Duplicate Admission Records Within Year
**Issue**: Same (code, section, annee) tuple appears twice in extracted data
**Current approach**: Deduplicate in memory; first occurrence wins
**Limitation**: Uses exact tuple matching, not smart conflict resolution

### 5. Tour Variation in Capacities
**Issue**: May have "principale", "main", "main-round" etc. for same round
**Current approach**: Tour value taken as-is from JSON
**Workaround**: Standardize extracted capacity JSON before seed

---

## File Paths to Adjust

In `prisma/seed.ts`, line ~87:

```typescript
const DATA_DIR = path.join(__dirname, "../../data");
```

**Adjust if:**
- Your data directory is in different location
- Files are in subdirectories other than `normalized/` and `normalized/2023`, etc.

**Directory structure expected:**
```
BideyatiPFA/
├── Server/
│   ├── prisma/
│   │   └── seed.ts           <- script location
│   └── data/
│       └── normalized/
│           ├── universites.json
│           ├── etablissements.json
│           ├── specialties_base.cleaned.sample.json
│           ├── 2023/
│           │   └── scores_2023_reference.by_section.json
│           ├── 2024/
│           │   └── scores_2024_reference.by_section.json
│           └── 2025/
│               ├── scores_2025.by_section.json
│               └── capacities_2025.by_section.json
```

---

## Running the Seed Script

### Prerequisites
```bash
cd Server

# Ensure dependencies installed
npm install

# Ensure Prisma Client is generated
npx prisma generate

# (Optional) Create/migrate schema to latest
npx prisma migrate dev
```

### Execute Seed
```bash
# Method 1: Direct TypeScript execution
npx ts-node prisma/seed.ts

# Method 2: Via npm script (if configured)
npm run seed

# Method 3: Via Prisma's built-in seed command
npx prisma db seed
```

### Expected Output
```
🌱 Starting Bideyati seed script...

📚 Seeding Universite...
  ✓ Processed X universities

🏢 Seeding Etablissement...
  ✓ Processed Y établissements

📖 Seeding Section (bac sections)...
  ✓ Processed 7 sections

🔗 Building codeOrientation -> Etablissement mapping...
  ✓ Mapped Z codeOrientation entries

🎓 Seeding Specialite...
  ✓ Processed N specialties

📊 Seeding StatistiqueAdmission...
  ✓ Processed StatistiqueAdmission records

📈 Seeding CapaciteAdmission...
  ✓ Processed M capacity records

═══════════════════════════════════════════════════════════
                    🎉 SEED SUMMARY 🎉                     
═══════════════════════════════════════════════════════════

universite           
  Inserted:      0
  Updated:       X
  Skipped:       0

etablissement        
  Inserted:      0
  Updated:       Y
  Skipped:       0

section              
  Inserted:      7
  Updated:       0

specialite           
  Inserted:      Z
  Updated:       0
  Unresolved:    W

statistiqueAdmission 
  Inserted:      A
  Updated:       0
  Unresolved:    B

capaciteAdmission    
  Inserted:      C
  Updated:       0
  Unresolved:    D

═══════════════════════════════════════════════════════════
✅ Seed completed successfully!
```

---

## Safety Checklist

### Pre-Seed
- [ ] All 8 data JSON files exist and are readable
- [ ] Database connection is active (`DATABASE_URL` set correctly)
- [ ] Database schema is migrated to latest (`npx prisma migrate deploy`)
- [ ] You have a backup (especially if seeding production)
- [ ] File paths in seed.ts match your actual directory structure
- [ ] `package.json` has `ts-node` or similar TypeScript executor

### During Seed
- [ ] Monitor output for error messages
- [ ] Note any "Unresolved" counts
- [ ] Check for unexpected "Skipped" counts (may indicate duplicates)

### Post-Seed
- [ ] Verify record counts in each table:
  ```sql
  SELECT COUNT(*) FROM "Universite";
  SELECT COUNT(*) FROM "Etablissement";
  SELECT COUNT(*) FROM "Section";
  SELECT COUNT(*) FROM "Specialite";
  SELECT COUNT(*) FROM "StatistiqueAdmission";
  SELECT COUNT(*) FROM "CapaciteAdmission";
  ```

- [ ] Check for null establishment linkages:
  ```sql
  SELECT COUNT(*) FROM "Specialite" WHERE "etablissementId" IS NULL;
  ```

- [ ] Verify unique constraints are working:
  ```sql
  SELECT "codeOrientation", COUNT(*) 
  FROM "Specialite" 
  GROUP BY "codeOrientation" 
  HAVING COUNT(*) > 1;
  ```

- [ ] Sample a few records to verify data integrity:
  ```sql
  SELECT * FROM "Specialite" 
  WHERE "codeOrientation" IN ('10101', '10102', '40101') 
  LIMIT 5;
  ```

- [ ] If unresolved count is too high (>10% of input), investigate:
  - Missing establishments
  - Typos in section names
  - Malformed input JSON

---

## Idempotency Behavior

The seed script is **fully idempotent**:

- **First run**: All records are `INSERT`ed (counted as "Updated")
- **Second run**: Records match on unique fields (id, codeOrientation, composite keys) and are skipped or updated
- **Consecutive runs**: Database state remains identical (no duplicates created)

This means you can safely re-run the seed after fixing extracted data.

---

## Extension Points

### Add New Data Source
1. Create processing function similar to existing ones
2. Add statistics entry to `stats` object
3. Call function in main seed
4. Update summary printing

### Change Deduplication Logic
Current: Exact tuple matching (annee, code, section)
Alternative: Keep latest by parsed_date or take minimum score

### Change Establishment Matching
Current: Exact case-insensitive name match
Alternative: Fuzzy matching, prefix matching, or code-based matching

---

## Rollback Strategy

If seed introduces bad data:

```bash
# Option 1: Delete and reseed
npx prisma migrate reset  # ⚠️ CAREFUL: Deletes all data

# Option 2: Manual cleanup queries
# In database console:
DELETE FROM "StatistiqueAdmission";
DELETE FROM "CapaciteAdmission";
DELETE FROM "Specialite";
DELETE FROM "Section";
DELETE FROM "Etablissement";
DELETE FROM "Universite";

# Then re-run seed.ts
```

---

## Debugging Tips

### Enable Prisma Logs
```bash
DEBUG=* npx ts-node prisma/seed.ts
```

### Check Input File Format
```bash
# Verify JSON is valid
npx ts-node -e "console.log(require('./data/normalized/specialties_base.cleaned.sample.json').slice(0,1))"
```

### Test Single Table
Comment out sections you don't want to run, isolate to specific table:
```typescript
// Comment out all seeding except Specialite
// await seedUniversite();
await seedSpecialite(); // run only this
```

