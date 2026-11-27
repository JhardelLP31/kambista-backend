# Kambista Backend — API de Cambio de Divisas

API REST desarrollada con **NestJS**, **TypeScript**, **MongoDB** y **Clean Architecture + DDD** para la gestión de autenticación JWT con roles, sincronización automática del tipo de cambio SUNAT y operaciones de cambio entre `USD` y `PEN`.

---

## 📋 Requisitos previos

- **Node.js** `>= 20` (probado con `v24.x`)
- **npm** `>= 10`
- **Docker** y **Docker Compose** (o una instancia local/remota de MongoDB `7.0+`)

---

## 🚀 Cómo levantar el proyecto en local

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd kambista-backend
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y ajusta tus secretos (los secretos JWT deben tener al menos 16 caracteres):
   ```bash
   cp .env.example .env
   ```

3. **Levantar MongoDB con Docker:**
   ```bash
   docker compose up -d
   ```

4. **Ejecutar la aplicación:**
   ```bash
   # Modo desarrollo (watch)
   npm run start:dev

   # Modo producción
   npm run build
   npm run start:prod
   ```

5. **Documentación interactiva (Swagger):**
   Una vez levantado el servidor, abre:
   - [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🔐 Variables de entorno (`.env.example`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP de la API | `3000` |
| `NODE_ENV` | Entorno (`development`, `production`, `test`) | `development` |
| `MONGO_URI` | Cadena de conexión a MongoDB | `mongodb://admin:adminpassword@localhost:27017/kambista?authSource=admin` |
| `JWT_SECRET` | Secreto para firmar `access_token` (mín. 16 chars) | `your_jwt_secret_key_min_16_chars` |
| `JWT_EXPIRES_IN` | Tiempo de expiración del `access_token` | `15m` |
| `JWT_REFRESH_SECRET` | Secreto para firmar `refresh_token` (mín. 16 chars) | `your_jwt_refresh_secret_key_min_16_chars` |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de expiración del `refresh_token` | `7d` |
| `SUNAT_API_URL` | Endpoint proveedor del tipo de cambio SUNAT | `https://api.apis.net.pe/v1/tipo-cambio-sunat` |

> Todas las variables son validadas al arranque mediante `Joi` en `AppModule` (fail-fast).

---

## 🔌 Endpoints principales

### Autenticación (`/v1/auth`)
- `POST /v1/auth/register` — Registra un usuario con rol por defecto `user`.
- `POST /v1/auth/login` — Devuelve `{ access_token, refresh_token, usuario }`.
- `POST /v1/auth/refresh` — Rota el `refresh_token` y emite un nuevo `access_token`.

### Tipo de cambio (`/v1/exchange-rate`) *(Requiere Bearer JWT)*
- `GET /v1/exchange-rate/latest` — Obtiene el tipo de cambio más reciente (caché en memoria / MongoDB).
- *Job automático:* cada **30 segundos** (y al iniciar el módulo) sincroniza desde `SUNAT_API_URL` hacia MongoDB y actualiza la caché.

### Transacciones (`/v1/transactions`) *(Requiere Bearer JWT)*
- `POST /v1/transactions` — Calcula y registra una solicitud de cambio (`USD → PEN` usa `venta`, `PEN → USD` usa `compra`).
- `GET /v1/transactions/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&userId=...`
  - Rol `user`: siempre visualiza **solo su propio** historial (ignora `userId` aunque se envíe).
  - Rol `admin`: puede enviar `userId` para consultar el historial de otro usuario.
  - Paginación opcional: enviando `?page=1&limit=20` responde `{ data, meta }`; sin estos parámetros devuelve el array directo `[...]`.

### Promover un usuario a `admin` en MongoDB
Por seguridad, el registro siempre asigna `rol: "user"`. Para probar flujos de `admin` en local:
```bash
docker exec -it kambista_mongo mongosh -u admin -p adminpassword --authenticationDatabase admin kambista --eval "db.users.updateOne({ email: 'juan@example.com' }, { \$set: { rol: 'admin' } })"
```

---

## 🧪 Ejecutar pruebas y calidad de código

```bash
# Pruebas unitarias
npm test

# Cobertura de pruebas
npm run test:cov

# Pruebas E2E (flujo completo HTTP sin depender de servicios externos)
npm run test:e2e

# Linter con type-checking (oxlint)
npm run lint

# Build de producción
npm run build
```

---

## 🏛️ Arquitectura y decisiones técnicas

### 1. Clean Architecture + DDD por Bounded Contexts
El proyecto está organizado en `src/modules/` por contextos (`auth`, `exchange-rate`, `transactions`) y `src/shared/`, aplicando estrictamente la **Regla de Dependencia**:
- **`domain/`**: Entidades puras (`User`, `ExchangeRate`, `Transaction`), Value/Enum types, interfaces de repositorio y excepciones de dominio sin ninguna dependencia de NestJS o Mongoose. Las entidades usan constructores privados y métodos fábrica (`create`, `createFromExchange`) para impedir estados inválidos en memoria.
- **`application/`**: Casos de uso (`RegisterUseCase`, `LoginUseCase`, `SyncExchangeRateUseCase`, `CreateTransactionUseCase`, etc.) y puertos (`Symbol` tokens) para inversión de dependencias.
- **`infrastructure/`**: Adaptadores concretos (Controllers, DTOs con `class-validator`, Swagger, Schemas/Repositorios Mongoose, Bcrypt, Passport JWT, Cron Scheduler y Cliente HTTP SUNAT).

### 2. Desacoplamiento entre módulos (Anti-Corruption Layer)
El módulo `transactions` no importa entidades ni repositorios de `exchange-rate`. Define su propio puerto `ExchangeRateReader` y en infraestructura `ExchangeRateModuleAdapter` delega en `GetLatestExchangeRateUseCase`.

### 3. Caché en memoria (Cache-Aside) e índices en MongoDB
- `SyncExchangeRateUseCase` persiste cada registro en MongoDB y refresca `MemoryExchangeRateCache` (TTL 60s).
- `GetLatestExchangeRateUseCase` lee primero de memoria para evitar consultas innecesarias a MongoDB en cada transacción; en caso de *cache miss*, consulta MongoDB usando un índice descendente `{ createdAt: -1 }` y vuelve a poblar la caché.
- En `transactions`, el índice compuesto `{ userId: 1, fecha: -1 }` optimiza las consultas del historial por rango de fechas.

### 4. Seguridad aplicada
- **Contraseñas**: hasheadas con `bcrypt` (cost factor 10) y excluidas mediante `toPublicProfile()`.
- **Refresh tokens con rotación y SHA-256**: en lugar de `bcrypt` (que trunca entradas a 72 bytes, lo que truncaría un JWT antes de su firma), los `refresh_token` se almacenan con hash **SHA-256** y se verifican con `crypto.timingSafeEqual`, invalidando el token previo en cada rotación.
- **Mensajes genéricos en login**: un usuario inexistente y una contraseña incorrecta devuelven el mismo error (`401 Credenciales inválidas`) para evitar enumeración de correos.
- **Rate limiting**: `@nestjs/throttler` limita intentos en `/v1/auth/login` y `/v1/auth/register` a 5 peticiones/minuto.
- **Manejo global de errores y logging**: `AllExceptionsFilter` traduce excepciones de dominio a códigos HTTP y oculta trazas internas ante errores 500; `LoggingInterceptor` emite logs estructurados JSON con método, ruta, `userId`, status y duración.

### 5. Pruebas E2E deterministas
Gracias a la inyección de dependencias mediante puertos (`Symbol`), `test/app.e2e-spec.ts` ejecuta todo el pipeline HTTP real (DTOs, `ValidationPipe`, `ThrottlerGuard`, `JwtAuthGuard`, `AllExceptionsFilter`, Casos de Uso, Caché, Bcrypt y JWT) usando repositorios in-memory y un proveedor fake de SUNAT, sin requerir MongoDB ni red externa.
