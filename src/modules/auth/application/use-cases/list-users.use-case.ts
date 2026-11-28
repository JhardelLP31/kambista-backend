import { Inject, Injectable } from '@nestjs/common';
import { PublicUserProfile } from '../../domain/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

export interface ListUsersQuery {
  search?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: ListUsersQuery = {}): Promise<PublicUserProfile[]> {
    const search = query.search?.trim() || undefined;
    const requestedLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);

    const users = await this.userRepository.findAll({ search, limit });
    return users.map((user) => user.toPublicProfile());
  }
}
