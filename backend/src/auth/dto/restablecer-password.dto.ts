import {
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RestablecerPasswordDto {
  @IsString({
    message:
      'El token debe ser una cadena válida.',
  })
  @IsNotEmpty({
    message:
      'El token de recuperación es obligatorio.',
  })
  @Length(
    64,
    64,
    {
      message:
        'El token de recuperación no es válido.',
    },
  )
  token!: string;

  @IsString({
    message:
      'La nueva contraseña debe ser una cadena válida.',
  })
  @IsNotEmpty({
    message:
      'La nueva contraseña es obligatoria.',
  })
  @MinLength(
    8,
    {
      message:
        'La nueva contraseña debe tener al menos 8 caracteres.',
    },
  )
  nuevaPassword!: string;

  @IsString({
    message:
      'La confirmación de contraseña debe ser válida.',
  })
  @IsNotEmpty({
    message:
      'Debes confirmar la nueva contraseña.',
  })
  @MinLength(
    8,
    {
      message:
        'La confirmación debe tener al menos 8 caracteres.',
    },
  )
  confirmarPassword!: string;
}