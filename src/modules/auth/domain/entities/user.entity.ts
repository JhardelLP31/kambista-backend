import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

export interface UserProps {
    id?: string;
    nombre: string;
    email: string;
    passwordHash: string;
    rol: UserRole;
    refreshTokenHash: string | null;
    createdAt: Date;
}

export interface PublicUserProfile {
    id: string;
    nombre: string;
    email: string;
    rol: UserRole;
}

export class User {
    public readonly id?: string;
    public readonly nombre: string;
    public readonly email: string;
    public readonly passwordHash: string;
    public readonly rol: UserRole;
    public readonly refreshTokenHash: string | null;
    public readonly createdAt: Date;

    private constructor(props: UserProps) {
        this.id = props.id;
        this.nombre = props.nombre;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.rol = props.rol;
        this.refreshTokenHash = props.refreshTokenHash;
        this.createdAt = props.createdAt;
    }

    public static create(
        props: Omit<UserProps, 'createdAt' | 'refreshTokenHash'> & {
            refreshTokenHash?: string | null;
            createdAt?: Date;
        },
    ): User {
        const normalizedEmail = props.email?.trim().toLowerCase();
        const trimmedName = props.nombre?.trim();

        if (!trimmedName || trimmedName.length < 2) {
            throw new ValidationDomainException('El nombre debe tener al menos 2 caracteres');
        }
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
            throw new ValidationDomainException('El email no tiene un formato válido');
        }
        if (!props.passwordHash) {
            throw new ValidationDomainException('El hash de contraseña es obligatorio');
        }

        return new User({
            id: props.id,
            nombre: trimmedName,
            email: normalizedEmail,
            passwordHash: props.passwordHash,
            rol: props.rol,
            refreshTokenHash: props.refreshTokenHash ?? null,
            createdAt: props.createdAt ?? new Date(),
        });
    }

    public toPublicProfile(): PublicUserProfile {
        return {
            id: this.id ?? '',
            nombre: this.nombre,
            email: this.email,
            rol: this.rol,
        };
    }
}