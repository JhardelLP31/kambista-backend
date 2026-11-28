import { UnauthorizedDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { User, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TokenService } from '../ports/token-service.port';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let tokenService: jest.Mocked<TokenService>;

  const sampleUser = User.create({
    id: 'user-1',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    passwordHash: 'hashed-password',
    rol: UserRole.USER,
    refreshTokenHash: 'stored-hash',
  });

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
      verifyTokenHash: jest.fn(),
    };

    useCase = new RefreshTokenUseCase(userRepository, tokenService);
  });

  it('should rotate refresh token and issue new access token', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      email: 'juan@example.com',
      rol: UserRole.USER,
    });
    userRepository.findById.mockResolvedValue(sampleUser);
    tokenService.verifyTokenHash.mockReturnValue(true);
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    tokenService.hashToken.mockReturnValue('new-hash');

    const result = await useCase.execute('old-refresh');

    expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'new-hash',
    );
    expect(result).toEqual({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });
  });

  it('should reject revoked or mismatched refresh token', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      email: 'juan@example.com',
      rol: UserRole.USER,
    });
    userRepository.findById.mockResolvedValue(sampleUser);
    tokenService.verifyTokenHash.mockReturnValue(false);

    await expect(useCase.execute('stolen-refresh')).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });
});
