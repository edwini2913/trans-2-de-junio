import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  randomUUID,
} from 'node:crypto';

import {
  mkdirSync,
} from 'node:fs';

import {
  resolve,
} from 'node:path';

import type {
  Response,
} from 'express';

import {
  diskStorage,
} from 'multer';

import {
  RegistrarComprobanteDto,
} from './dto/registrar-comprobante.dto';

import {
  RevisarPagoDto,
} from './dto/revisar-pago.dto';

import {
  EstadoPago,
} from './entities/pago.entity';

import {
  PagosService,
} from './pagos.service';

interface ArchivoComprobante {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}

interface ArchivoFiltro {
  mimetype: string;
}

type RespuestaFiltroArchivo = (
  error: Error | null,
  aceptarArchivo: boolean,
) => void;

const carpetaComprobantes =
  resolve(
    process.cwd(),
    'uploads',
    'comprobantes',
  );

mkdirSync(
  carpetaComprobantes,
  {
    recursive: true,
  },
);

const tiposPermitidos =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

function obtenerExtension(
  tipo: string,
): string {
  const extensiones:
    Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };

  return extensiones[tipo] ??
    '';
}

@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagosService:
      PagosService,
  ) {}

  /*
   * El pasajero registra su comprobante.
   *
   * El nombre del campo del archivo debe
   * ser exactamente: comprobante
   */
  @Post('comprobante')
  @UseInterceptors(
    FileInterceptor(
      'comprobante',
      {
        storage: diskStorage({
          destination:
            carpetaComprobantes,

          filename: (
            _solicitud,
            archivo,
            completar,
          ) => {
            const extension =
              obtenerExtension(
                archivo.mimetype,
              );

            completar(
              null,
              `${Date.now()}-${randomUUID()}${extension}`,
            );
          },
        }),

        limits: {
          files: 1,
          fileSize:
            5 * 1024 * 1024,
        },

        fileFilter: (
          _solicitud,
          archivo:
            ArchivoFiltro,
          completar:
            RespuestaFiltroArchivo,
        ) => {
          if (
            !tiposPermitidos.has(
              archivo.mimetype,
            )
          ) {
            completar(
              new BadRequestException(
                'El comprobante debe ser JPG, PNG, WEBP o PDF.',
              ),
              false,
            );

            return;
          }

          completar(
            null,
            true,
          );
        },
      },
    ),
  )
  registrarComprobante(
    @Body()
    dto:
      RegistrarComprobanteDto,

    @UploadedFile()
    archivo?:
      ArchivoComprobante,
  ) {
    return this.pagosService
      .registrarComprobante(
        dto,
        archivo,
      );
  }

  /*
   * Lista administrativa de pagos.
   *
   * Ejemplos:
   * GET /pagos
   * GET /pagos?estado=PENDIENTE
   */
  @Get()
  obtenerTodos(
    @Query('estado')
    estado?: EstadoPago,
  ) {
    return this.pagosService
      .obtenerTodos(
        estado,
      );
  }

  /*
   * Pagos enviados por un pasajero.
   */
  @Get('usuario/:usuarioId')
  obtenerPorUsuario(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.pagosService
      .obtenerPorUsuario(
        usuarioId,
      );
  }

  /*
   * Muestra el comprobante en el navegador.
   */
  @Get(':pagoId/comprobante')
  async verComprobante(
    @Param('pagoId')
    pagoId: string,

    @Res()
    respuesta: Response,
  ) {
    const archivo =
      await this.pagosService
        .obtenerArchivoComprobante(
          pagoId,
        );

    respuesta.type(
      archivo.tipo,
    );

    respuesta.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(
        archivo.nombre,
      )}`,
    );

    return respuesta.sendFile(
      archivo.rutaAbsoluta,
    );
  }

  /*
   * Obtiene el detalle de un pago.
   */
  @Get(':pagoId')
  obtenerPago(
    @Param('pagoId')
    pagoId: string,
  ) {
    return this.pagosService
      .obtenerPagoPorId(
        pagoId,
      );
  }

  /*
   * El administrador aprueba o rechaza.
   *
   * PATCH /pagos/:pagoId/revisar/:administradorId
   */
  @Patch(
    ':pagoId/revisar/:administradorId',
  )
  revisarPago(
    @Param('pagoId')
    pagoId: string,

    @Param('administradorId')
    administradorId: string,

    @Body()
    dto: RevisarPagoDto,
  ) {
    return this.pagosService
      .revisarPago(
        pagoId,
        administradorId,
        dto,
      );
  }
}
