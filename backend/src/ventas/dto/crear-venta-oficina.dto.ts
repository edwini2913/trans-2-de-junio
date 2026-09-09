import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CrearVentaOficinaDto {
  /*
   * Pasajero registrado.
   * Es opcional para permitir ventas en oficina
   * a personas que no tengan una cuenta.
   */
  @IsOptional()
  @IsUUID('4', {
    message:
      'El identificador del usuario no es válido',
  })
  usuarioId?: string;

  /*
   * Administrador o secretaria que realiza
   * la venta y bloqueó los asientos.
   */
  @IsUUID('4', {
    message:
      'El identificador del operador no es válido',
  })
  operadorId!: string;

  @IsString({
    message:
      'El nombre del pasajero debe ser texto',
  })
  @MinLength(3, {
    message:
      'El nombre del pasajero debe tener al menos 3 caracteres',
  })
  pasajeroNombre!: string;

  @IsString({
    message:
      'El CI del pasajero debe ser texto',
  })
  @MinLength(4, {
    message:
      'El CI del pasajero debe tener al menos 4 caracteres',
  })
  pasajeroCi!: string;

  @IsString({
    message:
      'El teléfono del pasajero debe ser texto',
  })
  @MinLength(7, {
    message:
      'El teléfono debe tener al menos 7 caracteres',
  })
  pasajeroTelefono!: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message:
        'El correo electrónico no es válido',
    },
  )
  pasajeroEmail?: string;

  @IsUUID('4', {
    message:
      'El identificador del viaje no es válido',
  })
  viajeId!: string;

  @IsArray({
    message:
      'Los asientos deben enviarse en una lista',
  })
  @ArrayMinSize(1, {
    message:
      'Debe seleccionar al menos un asiento',
  })
  @ArrayUnique({
    message:
      'No se pueden enviar asientos repetidos',
  })
  @IsUUID('4', {
    each: true,
    message:
      'Uno o más identificadores de asiento no son válidos',
  })
  asientoIds!: string[];

  @IsIn(
    [
      'EFECTIVO',
      'QR',
      'TRANSFERENCIA',
    ],
    {
      message:
        'El método de pago debe ser EFECTIVO, QR o TRANSFERENCIA',
    },
  )
  metodoPago!:
    | 'EFECTIVO'
    | 'QR'
    | 'TRANSFERENCIA';
}