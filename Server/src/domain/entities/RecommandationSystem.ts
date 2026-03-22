export class Questionnaire {
  constructor(
    public id: string,
    public dateSoumission: Date,
  ) {}

  soumettreQuestionnaire(): void {
    throw new Error("Method not implemented.");
  }
}

export class ReponseQuestionnaire {
  constructor(
    public question: string,
    public reponse: string,
  ) {}
}

export class ProfilAcademique {
  constructor(
    public moyenneBac: number,
    public scorePondere: number,
  ) {}

  calculerScorePondere(): void {
    throw new Error("Method not implemented.");
  }
}

export class Recommandation {
  constructor(
    public scoreCompatibilite: number,
    public rang: number,
  ) {}

  afficherCompatibilite(): void {
    throw new Error("Method not implemented.");
  }
}

export class ParametresRecommandation {
  constructor(
    public poidsScore: number,
    public poidsInterets: number,
    public poidsMatieres: number,
  ) {}

  modifierParametres(): void {
    throw new Error("Method not implemented.");
  }
}

export class Favori {
  constructor(public dateAjout: Date) {}

  ajouterSpecialiteFavori(): void {
    throw new Error("Method not implemented.");
  }
  retirerSpecialiteFavori(): void {
    throw new Error("Method not implemented.");
  }
}
