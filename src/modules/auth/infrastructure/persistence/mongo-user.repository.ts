import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import {
  FindUsersFilter,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UserDocument, UserMongoEntity } from './user.schema';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserMongoEntity.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async save(user: User): Promise<User> {
    const created = await this.model.create({
      nombre: user.nombre,
      email: user.email,
      passwordHash: user.passwordHash,
      rol: user.rol,
      refreshTokenHash: user.refreshTokenHash,
    });
    return this.toDomain(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ email: email.trim().toLowerCase() })
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: FindUsersFilter = {}): Promise<User[]> {
    const limit = filter.limit ?? 50;
    const search = filter.search?.trim();

    const queryFilter = search
      ? {
          $or: [
            { nombre: { $regex: escapeRegex(search), $options: 'i' } },
            { email: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {};

    const docs = await this.model
      .find(queryFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.model.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  private toDomain(doc: UserDocument): User {
    return User.create({
      id: doc._id.toString(),
      nombre: doc.nombre,
      email: doc.email,
      passwordHash: doc.passwordHash,
      rol: doc.rol,
      refreshTokenHash: doc.refreshTokenHash,
      createdAt: doc.createdAt,
    });
  }
}
