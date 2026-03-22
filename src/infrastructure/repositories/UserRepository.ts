import { Utilisateur } from "../../domain/entities/Utilisateur";

export class UserRepository {
  async findById(id: string): Promise<Utilisateur | null> {
    throw new Error("Not implemented");
  }

  async save(user: Utilisateur): Promise<void> {
    throw new Error("Not implemented");
  }
}
