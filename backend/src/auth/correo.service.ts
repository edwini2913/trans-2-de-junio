import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import * as nodemailer from 'nodemailer';

import type {
  Transporter,
} from 'nodemailer';

type DatosCorreoRecuperacion = {
  destinatario: string;
  nombreUsuario: string;
  token: string;
};

@Injectable()
export class CorreoService {
  private readonly transporter:
    Transporter;

  private readonly frontendUrl:
    string;

  private readonly correoRemitente:
    string;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    const host =
      this.configService.get<string>(
        'SMTP_HOST',
      );

    const puerto =
      Number(
        this.configService.get<string>(
          'SMTP_PORT',
        ) || 587,
      );

    const usuario =
      this.configService.get<string>(
        'SMTP_USER',
      );

    const password =
      this.configService.get<string>(
        'SMTP_PASS',
      );

    const seguro =
      this.configService.get<string>(
        'SMTP_SECURE',
      ) === 'true';

    this.frontendUrl =
      (
        this.configService.get<string>(
          'FRONTEND_URL',
        ) ||
        'http://localhost:5173'
      ).replace(/\/$/, '');

    this.correoRemitente =
      this.configService.get<string>(
        'SMTP_FROM',
      ) ||
      usuario ||
      'no-reply@trans2junio.com';

    if (
      !host ||
      !usuario ||
      !password
    ) {
      console.warn(
        'La configuración SMTP está incompleta.',
      );
    }

    this.transporter =
      nodemailer.createTransport({
        host,
        port:
          puerto,
        secure:
          seguro,
        auth: {
          user:
            usuario,
          pass:
            password,
        },
      });
  }

  async enviarRecuperacionPassword(
    datos: DatosCorreoRecuperacion,
  ): Promise<void> {
    const enlace =
      `${this.frontendUrl}` +
      `/restablecer-password` +
      `?token=${encodeURIComponent(
        datos.token,
      )}`;

    try {
      await this.transporter.sendMail({
        from: {
          name:
            'Trans 2 de Junio',
          address:
            this.correoRemitente,
        },

        to:
          datos.destinatario,

        subject:
          'Recuperación de contraseña - Trans 2 de Junio',

        text: `
Hola ${datos.nombreUsuario}.

Recibimos una solicitud para cambiar la contraseña de tu cuenta.

Abre el siguiente enlace:

${enlace}

Este enlace será válido durante 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.
        `.trim(),

        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>
    Recuperación de contraseña
  </title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f1f7f3;
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
  >
    <tr>
      <td
        align="center"
        style="padding: 40px 16px;"
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width: 600px;
            overflow: hidden;
            background: #ffffff;
            border-radius: 24px;
            box-shadow:
              0 20px 55px rgba(0, 80, 45, 0.14);
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 32px 24px;
                background:
                  linear-gradient(
                    135deg,
                    #004f31,
                    #008355
                  );
                color: #ffffff;
              "
            >
              <div
                style="
                  display: inline-block;
                  padding: 10px 16px;
                  border-radius: 999px;
                  background: rgba(
                    255,
                    255,
                    255,
                    0.12
                  );
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 1px;
                "
              >
                SISTEMA DE PASAJES
              </div>

              <h1
                style="
                  margin: 18px 0 0;
                  font-size: 28px;
                "
              >
                Trans 2 de Junio
              </h1>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 36px 32px;
              "
            >
              <h2
                style="
                  margin: 0;
                  color: #0f172a;
                  font-size: 24px;
                "
              >
                Recupera tu contraseña
              </h2>

              <p
                style="
                  margin: 20px 0 0;
                  color: #475569;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hola
                <strong>
                  ${this.escaparHtml(
                    datos.nombreUsuario,
                  )}
                </strong>.
              </p>

              <p
                style="
                  color: #475569;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Recibimos una solicitud para
                restablecer la contraseña de tu
                cuenta.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin: 28px 0;"
              >
                <tr>
                  <td align="center">
                    <a
                      href="${enlace}"
                      style="
                        display: inline-block;
                        padding: 16px 28px;
                        border-radius: 14px;
                        background: #047857;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                      "
                    >
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <div
                style="
                  padding: 18px;
                  border: 1px solid #d1fae5;
                  border-radius: 14px;
                  background: #ecfdf5;
                  color: #065f46;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                Este enlace será válido durante
                <strong>15 minutos</strong>.
              </div>

              <p
                style="
                  margin: 24px 0 0;
                  color: #64748b;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                Si no solicitaste este cambio,
                ignora el mensaje. Tu contraseña
                continuará siendo la misma.
              </p>

              <p
                style="
                  margin: 18px 0 0;
                  color: #94a3b8;
                  font-size: 11px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                Si el botón no funciona, copia y pega este enlace:
                <br />
                ${enlace}
              </p>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding: 22px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 12px;
              "
            >
              Sindicato Autotransporte
              Trans 2 de Junio
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
      });
    } catch (error: unknown) {
      console.error(
        'Error al enviar correo de recuperación:',
        this.obtenerMensajeError(
          error,
        ),
      );

      throw new InternalServerErrorException(
        'No se pudo enviar el correo de recuperación.',
      );
    }
  }

  async verificarConexion():
  Promise<void> {
    try {
      await this.transporter.verify();
    } catch (error: unknown) {
      console.error(
        'No se pudo conectar con el servidor SMTP:',
        this.obtenerMensajeError(
          error,
        ),
      );

      throw new InternalServerErrorException(
        'La configuración del servidor de correo no es válida.',
      );
    }
  }

  private escaparHtml(
    valor: string,
  ): string {
    return valor
      .replace(
        /&/g,
        '&amp;',
      )
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      )
      .replace(
        /"/g,
        '&quot;',
      )
      .replace(
        /'/g,
        '&#039;',
      );
  }

  private obtenerMensajeError(
    error: unknown,
  ): string {
    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      typeof error ===
        'object' &&
      error !== null &&
      'message' in error
    ) {
      const mensaje = (
        error as {
          message?: unknown;
        }
      ).message;

      if (
        typeof mensaje ===
          'string' &&
        mensaje.trim()
      ) {
        return mensaje;
      }
    }

    return 'Error desconocido.';
  }
}
