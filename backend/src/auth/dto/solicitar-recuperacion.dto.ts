import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class SolicitarRecuperacionDto {
  @IsString({
    message:
      'El correo electrónico debe ser válido.',
  })
  @IsNotEmpty({
    message:
      'El correo electrónico es obligatorio.',
  })
  @IsEmail(
    {},
    {
      message:
        'Debes ingresar un correo electrónico válido.',
    },
  )
  email!: string;
}