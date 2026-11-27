import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { PublicUserProfile } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';
import { TOKEN_SERVICE, TokenService } from '../ports/token-service.port';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  usuario: PublicUserProfile;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const normalizedEmail = command.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || !user.id) {
      throw new UnauthorizedDomainException('Credenciales inválidas');
    }

    const isPasswordValid = await this.passwordHasher.compare(
      command.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedDomainException('Credenciales inválidas');
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      rol: user.rol,
    });

    const refreshTokenHash = this.tokenService.hashToken(tokens.refreshToken);
    await this.userRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      usuario: user.toPublicProfile(),
    };
  }
}