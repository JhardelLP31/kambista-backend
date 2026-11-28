import { UnauthorizedDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { User, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../ports/password-hasher.port';
import { TokenService } from '../ports/token-service.port';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let tokenService: jest.Mocked<TokenService>;

  const sampleUser = User.create({
    id: 'user-1',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    passwordHash: 'hashed-password',
    rol: UserRole.USER,
  });

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
      verifyTokenHash: jest.fn(),
    };

    useCase = new LoginUseCase(userRepository, passwordHasher, tokenService);
  });

  it('should return tokens, store refresh token hash, and return safe usuario profile', async () => {
    userRepository.findByEmail.mockResolvedValue(sampleUser);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'access-jwt',
      refreshToken: 'refresh-jwt',
    });
    tokenService.hashToken.mockReturnValue('sha256-refresh-hash');

    const result = await useCase.execute({
      email: 'JUAN@example.com',
      password: 'password123',
    });

    expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'sha256-refresh-hash',
    );
    expect(result).toEqual({
      access_token: 'access-jwt',
      refresh_token: 'refresh-jwt',
      usuario: {
        id: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: UserRole.USER,
      },
    });
  });

  it('should throw UnauthorizedDomainException when user is not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('should throw UnauthorizedDomainException when password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(sampleUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'juan@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedDomainException);
  });
});
