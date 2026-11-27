import { UserRole } from '../../domain/entities/user.entity';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenPayload {
  sub: string;
  email: string;
  rol: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  generateTokens(payload: TokenPayload): Promise<AuthTokens>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  hashToken(token: string): string;
  verifyTokenHash(token: string, hash: string): boolean;
}