declare module "bcrypt" {
  const bcrypt: {
    hash(data: string, saltRounds: number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };
  export default bcrypt;
}

declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
  }

  const jwt: {
    sign(payload: unknown, secretOrPrivateKey: unknown, options?: SignOptions): string;
    verify(token: string, secretOrPublicKey: unknown): unknown;
  };
  export default jwt;
}

