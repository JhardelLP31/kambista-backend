import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { Roles } from '../decorators/roles.decorator';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly listUsersUseCase: ListUsersUseCase) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar perfiles públicos de usuarios (solo admin)',
    description:
      'Permite al rol admin listar o buscar clientes por nombre/email para consultar su historial sin exponer contraseñas ni tokens.',
  })
  @ApiOkResponse({
    description: 'Listado de perfiles públicos de usuarios',
    schema: {
      example: [
        {
          id: '6746b1a2f1d2e3a4b5c6d7e8',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          rol: 'user',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente' })
  @ApiForbiddenResponse({ description: 'Acceso restringido al rol admin' })
  list(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute({
      search: query.search,
      limit: query.limit,
    });
  }
}
