import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Types } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PASSWORD_HASHER } from '../src/modules/auth/application/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../src/modules/auth/application/ports/token-service.port';
import { ListUsersUseCase } from '../src/modules/auth/application/use-cases/list-users.use-case';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../src/modules/auth/application/use-cases/register.use-case';
import { User, UserRole } from '../src/modules/auth/domain/entities/user.entity';
import {
  FindUsersFilter,
  USER_REPOSITORY,
  UserRepository,
} from '../src/modules/auth/domain/repositories/user.repository';
import { AuthController } from '../src/modules/auth/infrastructure/controllers/auth.controller';
import { UsersController } from '../src/modules/auth/infrastructure/controllers/users.controller';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/infrastructure/guards/roles.guard';
import { BcryptPasswordHasher } from '../src/modules/auth/infrastructure/security/bcrypt-password.hasher';
import { JwtTokenService } from '../src/modules/auth/infrastructure/security/jwt-token.service';
import { JwtStrategy } from '../src/modules/auth/infrastructure/strategies/jwt.strategy';
import { EXCHANGE_RATE_CACHE } from '../src/modules/exchange-rate/application/ports/exchange-rate-cache.port';
import {
  EXCHANGE_RATE_PROVIDER,
  ExchangeRateProvider,
} from '../src/modules/exchange-rate/application/ports/exchange-rate-provider.port';
import { GetLatestExchangeRateUseCase } from '../src/modules/exchange-rate/application/use-cases/get-latest-exchange-rate.use-case';
import { SyncExchangeRateUseCase } from '../src/modules/exchange-rate/application/use-cases/sync-exchange-rate.entity';
import { ExchangeRate } from '../src/modules/exchange-rate/domain/entities/exchange-rate.entity';
import {
  EXCHANGE_RATE_REPOSITORY,
  ExchangeRateRepository,
} from '../src/modules/exchange-rate/domain/repositories/exchange-rate.repository';
import { MemoryExchangeRateCache } from '../src/modules/exchange-rate/infrastructure/cache/memory-exchange-rate.cache';
import { ExchangeRateController } from '../src/modules/exchange-rate/infrastructure/controllers/exchange-rate.controller';
import { EXCHANGE_RATE_READER } from '../src/modules/transactions/application/ports/exchange-rate-reader.port';
import { CreateTransactionUseCase } from '../src/modules/transactions/application/use-cases/create-transaction.use-case';
import { GetTransactionHistoryUseCase } from '../src/modules/transactions/application/use-cases/get-transaction-history.use-case';
import {
  Currency,
  Transaction,
} from '../src/modules/transactions/domain/entities/transaction.entity';
import {
  FindTransactionHistoryFilter,
  PaginatedTransactions,
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../src/modules/transactions/domain/repositories/transaction.repository';
import { ExchangeRateModuleAdapter } from '../src/modules/transactions/infrastructure/adapters/exchange-rate-module.adapter';
import { TransactionsController } from '../src/modules/transactions/infrastructure/controllers/transactions.controller';
import { AllExceptionsFilter } from '../src/shared/infrastructure/filters/all-exceptions.filter';

class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async save(user: User): Promise<User> {
    const saved = User.create({
      id: user.id ?? new Types.ObjectId().toString(),
      nombre: user.nombre,
      email: user.email,
      passwordHash: user.passwordHash,
      rol: user.rol,
      refreshTokenHash: user.refreshTokenHash,
      createdAt: user.createdAt,
    });
    this.users.push(saved);
    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      this.users.find((u) => u.email === email.trim().toLowerCase()) ?? null
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findAll(filter: FindUsersFilter = {}): Promise<User[]> {
    const limit = filter.limit ?? 50;
    const search = filter.search?.trim().toLowerCase();

    const filtered = search
      ? this.users.filter(
          (u) =>
            u.nombre.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search),
        )
      : [...this.users];

    return filtered.reverse().slice(0, limit);
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) return;
    const current = this.users[index];
    this.users[index] = User.create({
      id: current.id,
      nombre: current.nombre,
      email: current.email,
      passwordHash: current.passwordHash,
      rol: current.rol,
      refreshTokenHash,
      createdAt: current.createdAt,
    });
  }
}

class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  private readonly rates: ExchangeRate[] = [];

  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const saved = ExchangeRate.create({
      id: new Types.ObjectId().toString(),
      compra: exchangeRate.compra,
      venta: exchangeRate.venta,
      origen: exchangeRate.origen,
      moneda: exchangeRate.moneda,
      fechaProveedor: exchangeRate.fechaProveedor,
      createdAt: exchangeRate.createdAt,
    });
    this.rates.push(saved);
    return saved;
  }

  async findLatest(): Promise<ExchangeRate | null> {
    if (this.rates.length === 0) return null;
    return this.rates[this.rates.length - 1];
  }
}

class InMemoryTransactionRepository implements TransactionRepository {
  private readonly transactions: Transaction[] = [];

  async save(transaction: Transaction): Promise<Transaction> {
    const saved = Transaction.reconstitute({
      id: new Types.ObjectId().toString(),
      userId: transaction.userId,
      monedaOrigen: transaction.monedaOrigen,
      monedaDestino: transaction.monedaDestino,
      monto: transaction.monto,
      montoCambiado: transaction.montoCambiado,
      tipoCambio: transaction.tipoCambio,
      fecha: transaction.fecha,
    });
    this.transactions.push(saved);
    return saved;
  }

  async findHistory(
    filter: FindTransactionHistoryFilter,
  ): Promise<PaginatedTransactions> {
    const filtered = this.transactions
      .filter(
        (tx) =>
          tx.userId === filter.userId &&
          tx.fecha >= filter.startDate &&
          tx.fecha <= filter.endDate,
      )
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    if (filter.page !== undefined && filter.limit !== undefined) {
      const start = (filter.page - 1) * filter.limit;
      return {
        items: filtered.slice(start, start + filter.limit),
        total: filtered.length,
      };
    }

    return {
      items: filtered,
      total: filtered.length,
    };
  }
}

describe('Kambista API (e2e)', () => {
  let app: INestApplication<App>;
  let syncExchangeRateUseCase: SyncExchangeRateUseCase;
  let userRepository: InMemoryUserRepository;
  let passwordHasher: BcryptPasswordHasher;

  let userToken: string;
  let userRefreshToken: string;
  let userId: string;
  let otherUserId: string;
  let adminToken: string;

  beforeAll(async () => {
    const fakeProvider: ExchangeRateProvider = {
      fetchCurrentRate: async () => ({
        compra: 3.733,
        venta: 3.739,
        origen: 'SUNAT',
        moneda: 'USD',
        fecha: '2026-11-27',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              JWT_SECRET: 'e2e_test_jwt_secret_key_123456',
              JWT_EXPIRES_IN: '15m',
              JWT_REFRESH_SECRET: 'e2e_test_refresh_secret_key_123',
              JWT_REFRESH_EXPIRES_IN: '7d',
              SUNAT_API_URL: 'https://api.apis.net.pe/v1/tipo-cambio-sunat',
            }),
          ],
        }),
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60_000,
            limit: 100,
          },
        ]),
        CacheModule.register(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({}),
      ],
      controllers: [
        AuthController,
        UsersController,
        ExchangeRateController,
        TransactionsController,
      ],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        RegisterUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        ListUsersUseCase,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
        { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
        { provide: TOKEN_SERVICE, useClass: JwtTokenService },
        SyncExchangeRateUseCase,
        GetLatestExchangeRateUseCase,
        {
          provide: EXCHANGE_RATE_REPOSITORY,
          useClass: InMemoryExchangeRateRepository,
        },
        { provide: EXCHANGE_RATE_PROVIDER, useValue: fakeProvider },
        { provide: EXCHANGE_RATE_CACHE, useClass: MemoryExchangeRateCache },
        CreateTransactionUseCase,
        GetTransactionHistoryUseCase,
        {
          provide: TRANSACTION_REPOSITORY,
          useClass: InMemoryTransactionRepository,
        },
        { provide: EXCHANGE_RATE_READER, useClass: ExchangeRateModuleAdapter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    syncExchangeRateUseCase = moduleFixture.get(SyncExchangeRateUseCase);
    userRepository = moduleFixture.get(USER_REPOSITORY);
    passwordHasher = moduleFixture.get(PASSWORD_HASHER);

    // Sembramos un usuario admin directamente en la BD (según especificación)
    const adminHash = await passwordHasher.hash('admin123');
    await userRepository.save(
      User.create({
        nombre: 'Admin Kambista',
        email: 'admin@kambista.com',
        passwordHash: adminHash,
        rol: UserRole.ADMIN,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register users, prevent duplicate email, and login', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(regRes.body).toMatchObject({
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      rol: 'user',
    });
    expect(regRes.body.passwordHash).toBeUndefined();
    userId = regRes.body.id;

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Juan Duplicado',
        email: 'juan@example.com',
        password: 'password123',
      })
      .expect(409);

    const regOther = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'María López',
        email: 'maria@example.com',
        password: 'password123',
      })
      .expect(201);
    otherUserId = regOther.body.id;

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'juan@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(loginRes.body.access_token).toBeDefined();
    expect(loginRes.body.refresh_token).toBeDefined();
    expect(loginRes.body.usuario).toMatchObject({
      id: userId,
      email: 'juan@example.com',
      rol: 'user',
    });
    userToken = loginRes.body.access_token;
    userRefreshToken = loginRes.body.refresh_token;

    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'admin@kambista.com',
        password: 'admin123',
      })
      .expect(200);
    adminToken = adminLoginRes.body.access_token;
  });

  it('should reject unauthenticated requests to business endpoints', async () => {
    await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 100,
      })
      .expect(401);

    await request(app.getHttpServer())
      .get('/v1/exchange-rate/latest')
      .expect(401);
  });

  it('should reject transaction creation when no exchange rate is synced yet', async () => {
    await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 100,
      })
      .expect(404);
  });

  it('should sync exchange rate, read latest rate, and execute USD/PEN transactions', async () => {
    await syncExchangeRateUseCase.execute();

    const rateRes = await request(app.getHttpServer())
      .get('/v1/exchange-rate/latest')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(rateRes.body).toMatchObject({
      compra: 3.733,
      venta: 3.739,
      origen: 'SUNAT',
      moneda: 'USD',
    });

    const usdToPenRes = await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 100,
      })
      .expect(201);

    expect(usdToPenRes.body).toMatchObject({
      monedaOrigen: 'USD',
      monedaDestino: 'PEN',
      monto: 100,
      montoCambiado: 373.9,
      tipoCambio: 3.739,
    });
    expect(usdToPenRes.body.id).toBeDefined();
    expect(usdToPenRes.body.fecha).toBeDefined();

    const penToUsdRes = await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monedaOrigen: Currency.PEN,
        monedaDestino: Currency.USD,
        monto: 100,
      })
      .expect(201);

    expect(penToUsdRes.body).toMatchObject({
      monedaOrigen: 'PEN',
      monedaDestino: 'USD',
      monto: 100,
      montoCambiado: 26.79,
      tipoCambio: 3.733,
    });

    // Validación: monedas iguales
    await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.USD,
        monto: 50,
      })
      .expect(400);
  });

  it('should enforce role permissions and date filtering on transaction history', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Usuario normal ve su propio historial
    const userHistoryRes = await request(app.getHttpServer())
      .get(`/v1/transactions/history?startDate=${today}&endDate=${today}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(userHistoryRes.body)).toBe(true);
    expect(userHistoryRes.body).toHaveLength(2);

    // Usuario normal intentando ver el historial de otro userId: siempre ve el suyo propio
    const spoofRes = await request(app.getHttpServer())
      .get(
        `/v1/transactions/history?startDate=${today}&endDate=${today}&userId=${otherUserId}`,
      )
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(spoofRes.body).toHaveLength(2);

    // Admin sin userId ve solo su propio historial (0 transacciones)
    const adminOwnRes = await request(app.getHttpServer())
      .get(`/v1/transactions/history?startDate=${today}&endDate=${today}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminOwnRes.body).toHaveLength(0);

    // Admin con userId consulta el historial de Juan
    const adminTargetRes = await request(app.getHttpServer())
      .get(
        `/v1/transactions/history?startDate=${today}&endDate=${today}&userId=${userId}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminTargetRes.body).toHaveLength(2);

    // Paginación opcional
    const paginatedRes = await request(app.getHttpServer())
      .get(
        `/v1/transactions/history?startDate=${today}&endDate=${today}&page=1&limit=1`,
      )
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(paginatedRes.body.data).toHaveLength(1);
    expect(paginatedRes.body.meta).toEqual({
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    });
  });

  it('should restrict GET /v1/users to admin role and return public profiles', async () => {
    await request(app.getHttpServer()).get('/v1/users').expect(401);

    await request(app.getHttpServer())
      .get('/v1/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    const allRes = await request(app.getHttpServer())
      .get('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(allRes.body)).toBe(true);
    expect(allRes.body).toHaveLength(3);
    expect(allRes.body[0].passwordHash).toBeUndefined();
    expect(allRes.body[0].refreshTokenHash).toBeUndefined();

    const searchRes = await request(app.getHttpServer())
      .get('/v1/users?search=juan')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(searchRes.body).toHaveLength(1);
    expect(searchRes.body[0]).toMatchObject({
      id: userId,
      email: 'juan@example.com',
      rol: 'user',
    });
  });

  it('should rotate refresh token and reject reuse of old token', async () => {
    const refreshRes = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refresh_token: userRefreshToken })
      .expect(200);

    expect(refreshRes.body.access_token).toBeDefined();
    expect(refreshRes.body.refresh_token).toBeDefined();

    // Reutilizar el refresh token anterior debe fallar con 401
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refresh_token: userRefreshToken })
      .expect(401);
  });

  it('should rate limit excessive login attempts with 429', async () => {
    // Ya van 2 logins exitosos en el test de registro/login; completamos el límite de 5/min
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'juan@example.com', password: 'wrong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'juan@example.com', password: 'wrong-password' })
      .expect(429);
  });
});
