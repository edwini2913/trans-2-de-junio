import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ResponderReclamoDto {
  @IsString()
  @IsNotEmpty()
  mensaje!: string;

  @IsOptional()
  @IsString()
  archivoUrl?: string;

  @IsOptional()
  @IsString()
  nombreArchivo?: string;

  @IsOptional()
  @IsString()
  tipoArchivo?: string;
}