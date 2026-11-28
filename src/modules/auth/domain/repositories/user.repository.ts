import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface FindUsersFilter {
  search?: string;
  limit?: number;
}

export interface UserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(filter?: FindUsersFilter): Promise<User[]>;
  updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void>;
}
