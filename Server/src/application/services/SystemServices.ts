export class ServiceGestionUtilisateurs {
  activerUtilisateur(): void {
    throw new Error("Method not implemented.");
  }
  desactiverUtilisateur(): void {
    throw new Error("Method not implemented.");
  }
  supprimerUtilisateur(): void {
    throw new Error("Method not implemented.");
  }
}

export class ServiceSauvegarde {
  sauvegarderBaseDonnees(): void {
    throw new Error("Method not implemented.");
  }
  restaurerBaseDonnees(): void {
    throw new Error("Method not implemented.");
  }
}

export class JournalAudit {
  constructor(
    public action: string,
    public dateAction: Date,
  ) {}
}

export class ServiceAuthentification {
  authentifierUtilisateur(): void {
    throw new Error("Method not implemented.");
  }
  ouvrirSession(): void {
    throw new Error("Method not implemented.");
  }
  fermerSession(): void {
    throw new Error("Method not implemented.");
  }
}

export class MoteurRecherche {
  rechercherUniversites(): void {
    throw new Error("Method not implemented.");
  }
  rechercherSpecialites(): void {
    throw new Error("Method not implemented.");
  }
}

export class MoteurFiltrage {
  filtrerParRegion(): void {
    throw new Error("Method not implemented.");
  }
  filtrerParDomaine(): void {
    throw new Error("Method not implemented.");
  }
  filtrerParScore(): void {
    throw new Error("Method not implemented.");
  }
}

export class MoteurRecommandation {
  genererRecommandations(): void {
    throw new Error("Method not implemented.");
  }
  analyserProfil(): void {
    throw new Error("Method not implemented.");
  }
  comparerScoresAdmission(): void {
    throw new Error("Method not implemented.");
  }
}
