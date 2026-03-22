export class Universite {
  constructor(
    public id: string,
    public nom: string,
    public ville: string,
    public region: string,
    public description: string,
  ) {}
}

export class Specialite {
  constructor(
    public id: string,
    public nom: string,
    public domaine: string,
    public scoreMinimum: number,
  ) {}

  consulterDetails(): void {
    throw new Error("Method not implemented.");
  }
}

export class StatistiqueAdmission {
  constructor(
    public annee: number,
    public scoreMinimum: number,
    public tauxAdmission: number,
  ) {}
}

export class Metier {
  constructor(
    public titre: string,
    public secteur: string,
  ) {}
}
