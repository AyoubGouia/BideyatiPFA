declare module "bcrypt" {
  const bcrypt: {
    hash(data: string, saltRounds: number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };
  export default bcrypt;
}

declare module "jsonwebtoken" {
  const jwt: {
    sign(payload: unknown, secretOrPrivateKey: unknown, options?: unknown): string;
    verify(token: string, secretOrPublicKey: unknown): unknown;
  };
  export default jwt;
}

