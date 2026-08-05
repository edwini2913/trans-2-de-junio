import {
  ValidationPipe,
} from "@nestjs/common";

import {
  NestFactory,
} from "@nestjs/core";

import {
  AppModule,
} from "./app.module";

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
    );

  const puerto =
    Number(
      process.env.PORT,
    ) || 3000;

  const frontendConfigurado =
    process.env.FRONTEND_URL?.trim();

  const origenesPermitidos = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",

    /*
     * Frontend publicado anteriormente.
     * Puedes mantener ambos si usas
     * Vercel y Railway.
     */
    "https://trans-2-de-junio.vercel.app",

    frontendConfigurado,
  ].filter(
    (
      origen,
    ): origen is string =>
      Boolean(origen),
  );

  app.enableCors({
    origin: (
      origen,
      callback,
    ) => {
      /*
       * Permite solicitudes internas,
       * Postman, aplicaciones móviles
       * y peticiones sin cabecera Origin.
       */
      if (!origen) {
        callback(
          null,
          true,
        );
        return;
      }

      const esOrigenRegistrado =
        origenesPermitidos.includes(
          origen,
        );

      /*
       * Permite dominios generados
       * automáticamente por Vercel
       * y Railway.
       */
      const esDominioVercel =
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(
          origen,
        );

      const esDominioRailway =
        /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i.test(
          origen,
        );

      if (
        esOrigenRegistrado ||
        esDominioVercel ||
        esDominioRailway
      ) {
        callback(
          null,
          true,
        );
        return;
      }

      callback(
        new Error(
          `Origen no permitido por CORS: ${origen}`,
        ),
        false,
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],

    credentials: true,

    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(
    puerto,
    "0.0.0.0",
  );

  console.log(
    `Backend funcionando en el puerto ${puerto}`,
  );
}

void bootstrap();