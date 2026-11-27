import { Inject, Injectable } from '@nestjs/common';
import { ConflictDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { PublicUserProfile, User, UserRole } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';

export interface RegisterCommand {
  nombre: string;
  email: string;
  password: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterCommand): Promise<PublicUserProfile> {
    const normalizedEmail = command.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictDomainException('El email ya se encuentra registrado');
    }

    const passwordHash = await this.passwordHasher.hash(command.password);

    const newUser = User.create({
      nombre: command.nombre,
      email: normalizedEmail,
      passwordHash,
      rol: UserRole.USER,
    });

    const saved = await this.userRepository.save(newUser);
    return saved.toPublicProfile();
  }
}