import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong.' })
  email: string;

  @IsString({ message: 'Password harus berupa string.' })
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  password: string;
}
