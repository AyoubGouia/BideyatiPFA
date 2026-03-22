export class Section {
  constructor(
    public id: string,
    public nom: string,
  ) {}
}

export class Matiere {
  constructor(
    public id: string,
    public nom: string,
  ) {}
}

export class SectionMatiere {
  constructor(public coefficient: number) {}
}

export class NoteEtudiant {
  constructor(
    public valeur: number,
    public annee: number,
  ) {}

  saisirNote(): void {
    throw new Error("Method not implemented.");
  }
}
