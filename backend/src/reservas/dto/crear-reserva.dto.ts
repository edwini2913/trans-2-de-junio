import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CrearReservaDto {
  @IsUUID('4', {
    message: 'El identificador del usuario no es válido.',
  })
  usuarioId!: string;

  @IsUUID('4', {
    message: 'El identificador del viaje no es válido.',
  })
  viajeId!: string;

  @IsArray({
    message: 'Los asientos deben enviarse en una lista.',
  })
  @ArrayMinSize(1, {
    message: 'Debes seleccionar al menos un asiento.',
  })
  @ArrayUnique({
    message: 'No puedes seleccionar el mismo asiento más de una vez.',
  })
  @IsUUID('4', {
    each: true,
    message: 'Uno o más identificadores de asiento no son válidos.',
  })
  asientoIds!: string[];
}