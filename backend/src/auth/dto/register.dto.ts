import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  nombre!: string;

  @IsNotEmpty()
  apellido!: string;

  @IsNotEmpty()
  ci!: string;

  @IsNotEmpty()
  telefono!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}