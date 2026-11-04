import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser, RoleName } from '@tambun/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user || !user.roleName) {
      throw new ForbiddenException('Akses ditolak: Pengguna tidak memiliki peran yang terdefinisi.');
    }

    // SUPERADMIN always has access
    if (user.roleName === RoleName.SUPERADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.roleName);
    if (!hasRole) {
      throw new ForbiddenException(
        `Akses ditolak: Peran '${user.roleName}' tidak memiliki wewenang untuk aksi ini. Dibutuhkan salah satu dari: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
