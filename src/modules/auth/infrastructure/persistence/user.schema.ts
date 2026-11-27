import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../domain/entities/user.entity';

export type UserDocument = HydratedDocument<UserMongoEntity>;

@Schema({ collection: 'users', timestamps: true })
export class UserMongoEntity {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  rol!: UserRole;

  @Prop({ type: String, default: null })
  refreshTokenHash!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserMongoEntity);