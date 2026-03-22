export enum Role {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN",
  VISITOR = "VISITOR",
}

export class Utilisateur {
  constructor(
    public id: string,
    public nom: string,
    public prenom: string,
    public email: string,
    public telephone: string | null,
    public motDePasseHash: string,
    public actif: boolean,
    public dateCreation: Date,
    public role: Role = Role.VISITOR,
  ) {}

  consulterProfil(): void {
    throw new Error("Method not implemented.");
  }

  modifierProfil(): void {
    throw new Error("Method not implemented.");
  }
}

export class Etudiant extends Utilisateur {
  constructor(
    id: string,
    nom: string,
    prenom: string,
    email: string,
    telephone: string | null,
    motDePasseHash: string,
    actif: boolean,
    dateCreation: Date,
    public numeroBac: string,
    public moyenneBac: number | null,
  ) {
    super(
      id,
      nom,
      prenom,
      email,
      telephone,
      motDePasseHash,
      actif,
      dateCreation,
      Role.STUDENT,
    );
  }

  creerCompte(): void {
    throw new Error("Method not implemented.");
  }
  seConnecter(): void {
    throw new Error("Method not implemented.");
  }
  seDeconnecter(): void {
    throw new Error("Method not implemented.");
  }
  consulterRecommandations(): void {
    throw new Error("Method not implemented.");
  }
  ajouterFavori(): void {
    throw new Error("Method not implemented.");
  }
  supprimerFavori(): void {
    throw new Error("Method not implemented.");
  }
}

export class Administrateur extends Utilisateur {
  constructor(
    id: string,
    nom: string,
    prenom: string,
    email: string,
    telephone: string | null,
    motDePasseHash: string,
    actif: boolean,
    dateCreation: Date,
    public niveauAcces: number,
  ) {
    super(
      id,
      nom,
      prenom,
      email,
      telephone,
      motDePasseHash,
      actif,
      dateCreation,
      Role.ADMIN,
    );
  }

  gererUtilisateurs(): void {
    throw new Error("Method not implemented.");
  }
  gererUniversites(): void {
    throw new Error("Method not implemented.");
  }
  configurerParametresRecommandation(): void {
    throw new Error("Method not implemented.");
  }
}

export class Visiteur {
  consulterAccueil(): void {
    throw new Error("Method not implemented.");
  }
  consulterUniversites(): void {
    throw new Error("Method not implemented.");
  }
}

export class Session {
  constructor(
    public id: string,
    public token: string,
    public dateExpiration: Date,
    public utilisateurId: string,
  ) {}

  creerSession(): void {
    throw new Error("Method not implemented.");
  }
  terminerSession(): void {
    throw new Error("Method not implemented.");
  }
}
