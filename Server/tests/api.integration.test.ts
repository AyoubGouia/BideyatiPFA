import request from "supertest";
import app from "../src/app";
import { prisma, uniqueEmail } from "./helpers/testUtils";

describe("Bideyati Sprint 1 API integration", () => {
  const password = "StrongPass123";
  let token = "";
  let registeredEmail = "";
  let userId = "";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/home should be public and return overview", async () => {
    const res = await request(app).get("/api/home");
    expect(res.status).toBe(200);
    expect(res.body.platform?.name).toBe("Bideyati");
    expect(Array.isArray(res.body.universities)).toBe(true);
  });

  it("POST /api/auth/register should create student and return token", async () => {
    registeredEmail = uniqueEmail();
    const res = await request(app).post("/api/auth/register").send({
      nom: "Test",
      prenom: "Student",
      email: registeredEmail,
      telephone: "0550000000",
      motDePasse: password,
      numeroBAC: `BAC-${Date.now()}`,
      moyenneBac: 15.5,
    });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    token = res.body.token;
  });

  it("POST /api/auth/login should return token + session object", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: registeredEmail,
      motDePasse: password,
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.session).toBeDefined();
    expect(res.body.session.dateExpiration).toBeDefined();
    expect(res.body.user.email).toBe(registeredEmail);
    token = res.body.token;
    userId = res.body.user.id;
  });

  it("GET /api/profile should fail without auth", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });

  it("GET /api/profile should return student profile with auth", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(registeredEmail);
    expect(res.body.studentProfile).toBeDefined();
  });

  it("POST /api/questionnaire should store questionnaire and notes", async () => {
    const matieres = await prisma.matiere.findMany({
      orderBy: { nom: "asc" },
      take: 2,
    });
    expect(matieres.length).toBeGreaterThanOrEqual(2);

    const res = await request(app)
      .post("/api/questionnaire")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reponses: [
          { question: "Domaine prefere ?", reponse: "Informatique" },
          { question: "Prefere theory/pratique ?", reponse: "Pratique" },
        ],
        notes: [
          { matiereId: matieres[0].id, annee: 2023, valeur: 14.0 },
          { matiereId: matieres[1].id, annee: 2024, valeur: 15.0 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Questionnaire submitted");

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId },
      include: { reponses: true, profilAcademique: true },
    });
    expect(questionnaire).not.toBeNull();
    expect(questionnaire?.reponses.length).toBe(2);
    expect(questionnaire?.profilAcademique).not.toBeNull();
  });

  it("POST /api/auth/logout should invalidate session", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const profileAfterLogout = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(profileAfterLogout.status).toBe(401);
  });
});

