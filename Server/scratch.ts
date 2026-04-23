import { PrismaPg } from "@prisma/adapter-pg";
try {
  const adapter = new PrismaPg({ connectionString: "postgres://foo:bar@localhost:5432/db" } as any);
  console.log("Success instantiating PrismaPg with plain object");
} catch(e: any) {
  console.error("Error instantiating PrismaPg:", e.message);
}
