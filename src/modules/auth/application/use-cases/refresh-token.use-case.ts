import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, TokenService } from '../ports/token-service.port';

export interface RefreshTokenResult {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.id || !user.refreshTokenHash) {
      throw new UnauthorizedDomainException('Refresh token inválido o revocado');
    }

    const isMatch = this.tokenService.verifyTokenHash(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedDomainException('Refresh token inválido o revocado');
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      rol: user.rol,
    });

    const newHash = this.tokenService.hashToken(tokens.refreshToken);
    await this.userRepository.updateRefreshTokenHash(user.id, newHash);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}