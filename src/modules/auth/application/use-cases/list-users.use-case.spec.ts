import { User, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
    };

    useCase = new ListUsersUseCase(userRepository);
  });

  it('should return mapped PublicUserProfile[] without sensitive fields', async () => {
    const user = User.create({
      id: 'user-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      passwordHash: 'secret-bcrypt-hash',
      rol: UserRole.USER,
      refreshTokenHash: 'secret-refresh-hash',
    });
    userRepository.findAll.mockResolvedValue([user]);

    const result = await useCase.execute({ search: '  juan ', limit: 25 });

    expect(userRepository.findAll).toHaveBeenCalledWith({
      search: 'juan',
      limit: 25,
    });
    expect(result).toEqual([
      {
        id: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: UserRole.USER,
      },
    ]);
  });

  it('should clamp limit between 1 and 100 and ignore blank search', async () => {
    userRepository.findAll.mockResolvedValue([]);

    await useCase.execute({ search: '   ', limit: 500 });

    expect(userRepository.findAll).toHaveBeenCalledWith({
      search: undefined,
      limit: 100,
    });
  });
});
