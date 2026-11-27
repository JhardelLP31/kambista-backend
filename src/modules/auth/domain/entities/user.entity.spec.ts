import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  it('should create a user with normalized lowercase email and safe public profile', () => {
    const user = User.create({
      id: 'user-1',
      nombre: '  Juan Pérez  ',
      email: '  JUAN@Example.com  ',
      passwordHash: 'hashed-password',
      rol: UserRole.USER,
    });

    expect(user.nombre).toBe('Juan Pérez');
    expect(user.email).toBe('juan@example.com');
    expect(user.toPublicProfile()).toEqual({
      id: 'user-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      rol: UserRole.USER,
    });
  });

  it('should throw ValidationDomainException when nombre is too short', () => {
    expect(() =>
      User.create({
        nombre: 'A',
        email: 'juan@example.com',
        passwordHash: 'hashed',
        rol: UserRole.USER,
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should throw ValidationDomainException when email is invalid', () => {
    expect(() =>
      User.create({
        nombre: 'Juan',
        email: 'correo-invalido',
        passwordHash: 'hashed',
        rol: UserRole.USER,
      }),
    ).toThrow(ValidationDomainException);
  });
});
