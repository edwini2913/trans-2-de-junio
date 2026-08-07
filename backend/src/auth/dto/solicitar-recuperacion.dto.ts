import {
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class SolicitarRecuperacionDto {
  @IsEmail(
    {},
    {
      message:
        'Debes ingresar un correo electrónico válido.',
    },
  )
  @IsNotEmpty({
    message:
      'El correo electrónico es obligatorio.',
  })
  email!: string;
}