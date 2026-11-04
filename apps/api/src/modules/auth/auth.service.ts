import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser, RoleName } from '@tambun/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginRequestDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Kredensial login tidak valid.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun pengguna telah dinonaktifkan.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Kredensial login tidak valid.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roleName: user.role.name as RoleName,
    };

    const accessToken = this.jwtService.sign(payload);

    const userProfile: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleName: user.role.name as RoleName,
    };

    return {
      message: 'Login berhasil.',
      data: {
        accessToken,
        user: userProfile,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
      createdAt: user.createdAt,
    };
  }
}
