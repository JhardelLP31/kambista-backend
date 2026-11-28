import { ConflictDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { User, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../ports/password-hasher.port';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

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

    useCase = new RegisterUseCase(userRepository, passwordHasher);
  });

  it('should register a new user with default role user and hashed password', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-secret');
    userRepository.save.mockImplementation(async (user) =>
      User.create({
        id: 'user-1',
        nombre: user.nombre,
        email: user.email,
        passwordHash: user.passwordHash,
        rol: user.rol,
      }),
    );

    const result = await useCase.execute({
      nombre: 'Juan Pérez',
      email: 'JUAN@example.com',
      password: 'password123',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('juan@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(result).toEqual({
      id: 'user-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      rol: UserRole.USER,
    });
  });

  it('should throw ConflictDomainException if email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue(
      User.create({
        id: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        passwordHash: 'hashed',
        rol: UserRole.USER,
      }),
    );

    await expect(
      useCase.execute({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictDomainException);
  });
});
