import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../../application/ports/token-service.port';
import { UserRole } from '../../domain/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: TokenPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}