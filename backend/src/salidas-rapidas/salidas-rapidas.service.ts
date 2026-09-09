import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  InjectRepository,
} from "@nestjs/typeorm";

import {
  DataSource,
  In,
  Repository,
} from "typeorm";

import {
  AsientoViaje,
  EstadoAsientoViaje,
} from "../asientos/entities/asiento-viaje.entity";

import {
  Ruta,
} from "../rutas/entities/ruta.entity";

import {
  Usuario,
} from "../users/entities/usuario.entity";

import {
  esVehiculoSectorRapido,
} from "../vehiculos/constants/vehiculo.constants";

import {
  Vehiculo,
} from "../vehiculos/entities/vehiculo.entity";

import {
  EstadoViaje,
  Viaje,
} from "../viajes/entities/viaje.entity";

import {
  ActualizarEstadoRecojoDto,
} from "./dto/actualizar-estado-recojo.dto";

import {
  AgregarVehiculoFilaDto,
} from "./dto/agregar-vehiculo-fila.dto";

import {
  CrearFilaSalidaDto,
} from "./dto/crear-fila-salida.dto";

import {
  PublicarAvisoSalidaDto,
} from "./dto/publicar-aviso-salida.dto";

import {
  SolicitarRecojoDto,
} from "./dto/solicitar-recojo.dto";

import {
  AvisoSalida,
  TipoServicioAviso,
} from "./entities/aviso-salida.entity";

import {
  EstadoSolicitudRecojo,
  SolicitudRecojo,
} from "./entities/solicitud-recojo.entity";

import {
  EstadoTurnoVehiculo,
  TurnoVehiculo,
} from "./entities/turno-vehiculo.entity";

@Injectable()
export class SalidasRapidasService {
  constructor(
    @InjectRepository(TurnoVehiculo)
    private readonly turnosRepository:
      Repository<TurnoVehiculo>,

    @InjectRepository(SolicitudRecojo)
    private readonly recojosRepository:
      Repository<SolicitudRecojo>,

    @InjectRepository(AvisoSalida)
    private readonly avisosRepository:
      Repository<AvisoSalida>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una fila con todos los Noah o Hiace
   * que administración considere necesarios.
   *
   * También genera un viaje y sus asientos
   * para cada vehículo seleccionado.
   */
  async crearFila(
    dto: CrearFilaSalidaDto,
  ) {
    const fecha = dto.fecha.substring(0, 10);

    if (
      !Array.isArray(dto.vehiculoIds) ||
      dto.vehiculoIds.length === 0
    ) {
      throw new BadRequestException(
        "Debe seleccionar al menos un vehículo.",
      );
    }

    if (
      new Set(dto.vehiculoIds).size !==
      dto.vehiculoIds.length
    ) {
      throw new BadRequestException(
        "No se pueden seleccionar vehículos repetidos.",
      );
    }

    const horaBase =
      this.normalizarHora(
        dto.horaInicio,
      );

    const intervaloMinutos =
      dto.intervaloMinutos ?? 30;

    await this.dataSource.transaction(
      async (manager) => {
        const ruta =
          await manager.findOne(Ruta, {
            where: {
              id: dto.rutaId,
            },
          });

        if (!ruta) {
          throw new NotFoundException(
            "La ruta seleccionada no existe.",
          );
        }

        if (!ruta.estado) {
          throw new BadRequestException(
            "La ruta seleccionada está deshabilitada.",
          );
        }

        const operador =
          await manager.findOne(Usuario, {
            where: {
              id: dto.habilitadoPor,
              estado: true,
            },
          });

        if (!operador) {
          throw new NotFoundException(
            "El administrador o secretaria no existe.",
          );
        }

        const filaExistente =
          await manager.count(
            TurnoVehiculo,
            {
              where: {
                ruta: {
                  id: dto.rutaId,
                },
                fecha,
                activo: true,
              },
            },
          );

        if (filaExistente > 0) {
          throw new ConflictException(
            "Esta ruta ya tiene una fila rápida habilitada para la fecha seleccionada.",
          );
        }

        const vehiculos =
          await manager.find(
            Vehiculo,
            {
              where: {
                id: In(dto.vehiculoIds),
              },
            },
          );

        if (
          vehiculos.length !==
          dto.vehiculoIds.length
        ) {
          throw new NotFoundException(
            "Uno o más vehículos seleccionados no existen.",
          );
        }

        const vehiculosOrdenados =
          dto.vehiculoIds.map(
            (vehiculoId) => {
              const vehiculo =
                vehiculos.find(
                  (item) =>
                    item.id === vehiculoId,
                );

              if (!vehiculo) {
                throw new NotFoundException(
                  "No se encontró uno de los vehículos seleccionados.",
                );
              }

              return vehiculo;
            },
          );

        for (
          let indice = 0;
          indice <
          vehiculosOrdenados.length;
          indice += 1
        ) {
          const vehiculo =
            vehiculosOrdenados[indice];

          if (!vehiculo.estado) {
            throw new BadRequestException(
              `El vehículo ${vehiculo.placa} está deshabilitado.`,
            );
          }

          if (
            !esVehiculoSectorRapido(
              vehiculo.tipo,
            )
          ) {
            throw new BadRequestException(
              `El vehículo ${vehiculo.placa} no es Noah ni Hiace.`,
            );
          }

          const capacidad =
            Number(vehiculo.capacidad);

          if (
            !Number.isInteger(capacidad) ||
            ![7, 10].includes(capacidad)
          ) {
            throw new BadRequestException(
              `La capacidad del vehículo ${vehiculo.placa} no es válida.`,
            );
          }

          const viaje =
            manager.create(Viaje, {
              ruta,
              vehiculo,
              fecha,
              horaSalida:
                this.sumarMinutosHora(
                  horaBase,
                  indice *
                    intervaloMinutos,
                ),
              precio:
                Number(dto.precio),
              asientosDisponibles:
                capacidad,
              estado:
                EstadoViaje.PROGRAMADO,
            });

          const viajeGuardado =
            await manager.save(
              Viaje,
              viaje,
            );

          const asientos =
            Array.from(
              {
                length: capacidad,
              },
              (_, posicion) =>
                manager.create(
                  AsientoViaje,
                  {
                    viaje:
                      viajeGuardado,
                    numero:
                      posicion + 1,
                    estado:
                      EstadoAsientoViaje.DISPONIBLE,
                    bloqueadoPor:
                      null,
                    bloqueadoHasta:
                      null,
                  },
                ),
            );

          await manager.save(
            AsientoViaje,
            asientos,
          );

          const posicion = indice + 1;

          let estado =
            EstadoTurnoVehiculo.EN_ESPERA;

          if (posicion === 1) {
            estado =
              EstadoTurnoVehiculo.VENDIENDO;
          }

          if (posicion === 2) {
            estado =
              EstadoTurnoVehiculo.SIGUIENTE;
          }

          const turno =
            manager.create(
              TurnoVehiculo,
              {
                ruta,
                vehiculo,
                viaje:
                  viajeGuardado,
                fecha,
                posicion,
                estado,
                activo: true,
                fechaInicioVenta:
                  posicion === 1
                    ? new Date()
                    : null,
                fechaSalida:
                  null,
                habilitadoPor:
                  dto.habilitadoPor,
              },
            );

          await manager.save(
            TurnoVehiculo,
            turno,
          );
        }
      },
    );

    return {
      mensaje:
        "La fila fue creada. Los vehículos ya pueden recibir compras y reservas.",
      horaBase:
        horaBase.substring(0, 5),
      intervaloMinutos,
      fila:
        await this.listarFila(
          dto.rutaId,
          fecha,
        ),
    };
  }

  /**
   * Agrega un Noah o Hiace al final de una
   * fila que ya fue habilitada.
   */
  async agregarVehiculoFila(
    dto: AgregarVehiculoFilaDto,
  ) {
    const fecha = dto.fecha.substring(0, 10);
    const intervaloMinutos =
      dto.intervaloMinutos ?? 30;

    let turnoCreadoId = "";

    await this.dataSource.transaction(
      async (manager) => {
        const operador =
          await manager.findOne(Usuario, {
            where: {
              id: dto.administradorId,
              estado: true,
            },
          });

        if (!operador) {
          throw new NotFoundException(
            "El administrador o secretaria no existe.",
          );
        }

        const ruta =
          await manager.findOne(Ruta, {
            where: {
              id: dto.rutaId,
              estado: true,
            },
          });

        if (!ruta) {
          throw new NotFoundException(
            "La ruta seleccionada no existe o está deshabilitada.",
          );
        }

        const vehiculo =
          await manager.findOne(Vehiculo, {
            where: {
              id: dto.vehiculoId,
              estado: true,
            },
          });

        if (!vehiculo) {
          throw new NotFoundException(
            "El vehículo seleccionado no existe o está deshabilitado.",
          );
        }

        if (
          !esVehiculoSectorRapido(
            vehiculo.tipo,
          )
        ) {
          throw new BadRequestException(
            "Solamente se pueden agregar vehículos Noah o Hiace.",
          );
        }

        const capacidad =
          Number(vehiculo.capacidad);

        if (
          !Number.isInteger(capacidad) ||
          ![7, 10].includes(capacidad)
        ) {
          throw new BadRequestException(
            `La capacidad del vehículo ${vehiculo.placa} no es válida.`,
          );
        }

        const turnosExistentes =
          await manager.find(
            TurnoVehiculo,
            {
              where: {
                ruta: {
                  id: dto.rutaId,
                },
                fecha,
              },
              relations: {
                ruta: true,
                vehiculo: true,
                viaje: true,
              },
              order: {
                posicion: "ASC",
              },
            },
          );

        const turnosActivos =
          turnosExistentes.filter(
            (turno) => turno.activo,
          );

        if (turnosActivos.length === 0) {
          throw new BadRequestException(
            "Primero debes habilitar una fila para esta ruta y fecha.",
          );
        }

        const vehiculoYaRegistrado =
          turnosExistentes.some(
            (turno) =>
              turno.vehiculo.id ===
              dto.vehiculoId,
          );

        if (vehiculoYaRegistrado) {
          throw new ConflictException(
            "Este vehículo ya pertenece a la fila seleccionada.",
          );
        }

        const ultimoTurno =
          turnosActivos[
            turnosActivos.length - 1
          ];

        const posicion =
          Math.max(
            ...turnosExistentes.map(
              (turno) => turno.posicion,
            ),
          ) + 1;

        const horaAnterior =
          ultimoTurno.viaje.horaSalida;

        const viaje =
          manager.create(Viaje, {
            ruta,
            vehiculo,
            fecha,
            horaSalida:
              this.sumarMinutosHora(
                horaAnterior,
                intervaloMinutos,
              ),
            precio: Number(
              ultimoTurno.viaje.precio,
            ),
            asientosDisponibles:
              capacidad,
            estado:
              EstadoViaje.PROGRAMADO,
          });

        const viajeGuardado =
          await manager.save(
            Viaje,
            viaje,
          );

        const asientos =
          Array.from(
            {
              length: capacidad,
            },
            (_, indice) =>
              manager.create(
                AsientoViaje,
                {
                  viaje: viajeGuardado,
                  numero: indice + 1,
                  estado:
                    EstadoAsientoViaje.DISPONIBLE,
                  bloqueadoPor: null,
                  bloqueadoHasta: null,
                },
              ),
          );

        await manager.save(
          AsientoViaje,
          asientos,
        );

        const turno =
          manager.create(
            TurnoVehiculo,
            {
              ruta,
              vehiculo,
              viaje: viajeGuardado,
              fecha,
              posicion,
              estado:
                EstadoTurnoVehiculo.EN_ESPERA,
              activo: true,
              fechaInicioVenta: null,
              fechaSalida: null,
              habilitadoPor:
                dto.administradorId,
            },
          );

        const turnoGuardado =
          await manager.save(
            TurnoVehiculo,
            turno,
          );

        turnoCreadoId =
          turnoGuardado.id;

        await this.reordenarEstados(
          manager,
          dto.rutaId,
          fecha,
        );
      },
    );

    return {
      mensaje:
        "El vehículo fue agregado al final de la fila correctamente.",
      turnoId: turnoCreadoId,
      fila: await this.listarFila(
        dto.rutaId,
        fecha,
      ),
    };
  }

  /**
   * Publica un comunicado para los pasajeros.
   * Solo puede existir un aviso activo por
   * ruta y fecha.
   */
  async publicarAviso(
    dto: PublicarAvisoSalidaDto,
  ) {
    const fecha = dto.fecha.substring(0, 10);

    let permiteCompra = false;
    let puntoLlegadaTemporal:
      string | null = null;

    if (
      dto.tipoServicio ===
      TipoServicioAviso.SERVICIO_PARCIAL
    ) {
      const punto =
        dto.puntoLlegadaTemporal
          ?.trim();

      if (!punto || punto.length < 3) {
        throw new BadRequestException(
          "Debes indicar el punto exacto hasta donde llegará el vehículo.",
        );
      }

      permiteCompra = true;
      puntoLlegadaTemporal = punto;
    } else if (
      dto.tipoServicio ===
      TipoServicioAviso.INFORMATIVO
    ) {
      permiteCompra = true;
    }

    const avisoGuardado =
      await this.dataSource.transaction(
        async (manager) => {
          const ruta =
            await manager.findOne(Ruta, {
              where: {
                id: dto.rutaId,
              },
            });

          if (!ruta) {
            throw new NotFoundException(
              "La ruta seleccionada no existe.",
            );
          }

          const operador =
            await manager.findOne(
              Usuario,
              {
                where: {
                  id: dto.publicadoPor,
                  estado: true,
                },
              },
            );

          if (!operador) {
            throw new NotFoundException(
              "El administrador o secretaria no existe.",
            );
          }

          const avisosAnteriores =
            await manager.find(
              AvisoSalida,
              {
                where: {
                  ruta: {
                    id: dto.rutaId,
                  },
                  fecha,
                  activo: true,
                },
              },
            );

          if (avisosAnteriores.length > 0) {
            const ahora = new Date();

            avisosAnteriores.forEach(
              (aviso) => {
                aviso.activo = false;
                aviso.retiradoPor =
                  dto.publicadoPor;
                aviso.fechaRetiro = ahora;
              },
            );

            await manager.save(
              AvisoSalida,
              avisosAnteriores,
            );
          }

          const aviso =
            manager.create(
              AvisoSalida,
              {
                ruta,
                fecha,
                motivo: dto.motivo,
                tipoServicio:
                  dto.tipoServicio,
                permiteCompra,
                puntoLlegadaTemporal,
                titulo:
                  dto.titulo.trim(),
                mensaje:
                  dto.mensaje.trim(),
                activo: true,
                publicadoPor:
                  dto.publicadoPor,
                retiradoPor: null,
                fechaRetiro: null,
              },
            );

          return manager.save(
            AvisoSalida,
            aviso,
          );
        },
      );

    return {
      mensaje:
        "El aviso fue publicado correctamente para los pasajeros.",
      aviso: avisoGuardado,
    };
  }

  /**
   * Consulta pública utilizada por la pantalla
   * del pasajero. Devuelve null cuando no hay
   * ningún comunicado activo.
   */
  async obtenerAvisoActivo(
    rutaId: string,
    fecha: string,
  ) {
    const fechaNormalizada =
      fecha.substring(0, 10);

    if (!rutaId || !fechaNormalizada) {
      throw new BadRequestException(
        "La ruta y la fecha son obligatorias.",
      );
    }

    const aviso =
      await this.avisosRepository.findOne({
        where: {
          ruta: {
            id: rutaId,
          },
          fecha: fechaNormalizada,
          activo: true,
        },
        relations: {
          ruta: true,
        },
        order: {
          fechaPublicacion: "DESC",
        },
      });

    return aviso ?? null;
  }

  /**
   * Retira un aviso cuando vuelven a existir
   * vehículos o se normaliza la carretera.
   */
  async retirarAviso(
    avisoId: string,
    administradorId: string,
  ) {
    const administrador =
      await this.dataSource
        .getRepository(Usuario)
        .findOne({
          where: {
            id: administradorId,
            estado: true,
          },
        });

    if (!administrador) {
      throw new NotFoundException(
        "El administrador o secretaria no existe.",
      );
    }

    const aviso =
      await this.avisosRepository.findOne({
        where: {
          id: avisoId,
        },
      });

    if (!aviso) {
      throw new NotFoundException(
        "El aviso seleccionado no existe.",
      );
    }

    if (!aviso.activo) {
      return {
        mensaje:
          "El aviso ya se encontraba retirado.",
        aviso,
      };
    }

    aviso.activo = false;
    aviso.retiradoPor =
      administradorId;
    aviso.fechaRetiro = new Date();

    const guardado =
      await this.avisosRepository.save(
        aviso,
      );

    return {
      mensaje:
        "El aviso fue retirado correctamente.",
      aviso: guardado,
    };
  }

  /**
   * Devuelve la fila con la ocupación
   * actualizada de cada vehículo.
   */
  async listarFila(
    rutaId: string,
    fecha: string,
  ) {
    const fechaNormalizada =
      fecha.substring(0, 10);

    await this.liberarBloqueosVencidos();

    await this.sincronizarFila(
      rutaId,
      fechaNormalizada,
    );

    const turnos =
      await this.turnosRepository.find({
        where: {
          ruta: {
            id: rutaId,
          },
          fecha:
            fechaNormalizada,
        },
        relations: {
          ruta: true,
          vehiculo: true,
          viaje: true,
        },
        order: {
          posicion: "ASC",
        },
      });

    if (turnos.length === 0) {
      return [];
    }

    const viajeIds =
      turnos.map(
        (turno) =>
          turno.viaje.id,
      );

    const asientos =
      await this.dataSource
        .getRepository(AsientoViaje)
        .find({
          where: {
            viaje: {
              id: In(viajeIds),
            },
          },
          relations: {
            viaje: true,
          },
          order: {
            numero: "ASC",
          },
        });

    return turnos.map(
      (turno) => {
        const asientosVehiculo =
          asientos.filter(
            (asiento) =>
              asiento.viaje.id ===
              turno.viaje.id,
          );

        const disponibles =
          asientosVehiculo.filter(
            (asiento) =>
              asiento.estado ===
              EstadoAsientoViaje.DISPONIBLE,
          ).length;

        const bloqueados =
          asientosVehiculo.filter(
            (asiento) =>
              asiento.estado ===
              EstadoAsientoViaje.BLOQUEADO,
          ).length;

        const reservados =
          asientosVehiculo.filter(
            (asiento) =>
              asiento.estado ===
              EstadoAsientoViaje.RESERVADO,
          ).length;

        const vendidos =
          asientosVehiculo.filter(
            (asiento) =>
              asiento.estado ===
              EstadoAsientoViaje.VENDIDO,
          ).length;

        const ocupados =
          bloqueados +
          reservados +
          vendidos;

        const capacidad =
          Number(
            turno.vehiculo.capacidad,
          );

        const porcentaje =
          capacidad > 0
            ? Math.round(
                (ocupados /
                  capacidad) *
                  100,
              )
            : 0;

        return {
          id: turno.id,
          posicion:
            turno.posicion,
          estado:
            turno.estado,
          activo:
            turno.activo,
          fecha:
            turno.fecha,
          fechaInicioVenta:
            turno.fechaInicioVenta,
          fechaSalida:
            turno.fechaSalida,

          ruta: {
            id:
              turno.ruta.id,
            origen:
              turno.ruta.origen,
            destino:
              turno.ruta.destino,
          },

          vehiculo: {
            id:
              turno.vehiculo.id,
            placa:
              turno.vehiculo.placa,
            numeroFlota:
              turno.vehiculo
                .numeroFlota,
            marca:
              turno.vehiculo.marca,
            modelo:
              turno.vehiculo.modelo,
            tipo:
              turno.vehiculo.tipo,
            capacidad,
          },

          viaje: {
            id:
              turno.viaje.id,
            horaSalida:
              turno.viaje.horaSalida,
            precio:
              Number(
                turno.viaje.precio,
              ),
          },

          ocupacion: {
            capacidad,
            disponibles,
            bloqueados,
            reservados,
            vendidos,
            ocupados,
            faltan:
              Math.max(
                capacidad -
                  ocupados,
                0,
              ),
            porcentaje,
          },

          asientos:
            asientosVehiculo.map(
              (asiento) => ({
                id:
                  asiento.id,
                numero:
                  asiento.numero,
                estado:
                  asiento.estado,
                bloqueadoPor:
                  asiento
                    .bloqueadoPor,
                bloqueadoHasta:
                  asiento
                    .bloqueadoHasta,
              }),
            ),
        };
      },
    );
  }

  /**
   * Obtiene el vehículo que actualmente
   * está recibiendo pasajeros.
   */
  async obtenerSalidaActual(
    rutaId: string,
    fecha: string,
  ) {
    const fila =
      await this.listarFila(
        rutaId,
        fecha,
      );

    const actual =
      fila.find(
        (turno) =>
          turno.estado ===
          EstadoTurnoVehiculo.VENDIENDO,
      );

    if (!actual) {
      throw new NotFoundException(
        "No existe un vehículo recibiendo pasajeros para esta ruta.",
      );
    }

    return {
      actual,
      siguiente:
        fila.find(
          (turno) =>
            turno.estado ===
            EstadoTurnoVehiculo.SIGUIENTE,
        ) ?? null,
      fila,
    };
  }

  /**
   * Autoriza la salida del vehículo actual
   * y habilita automáticamente al siguiente.
   */
  async autorizarSalida(
    turnoId: string,
    administradorId: string,
  ) {
    await this.dataSource.transaction(
      async (manager) => {
        const administrador =
          await manager.findOne(
            Usuario,
            {
              where: {
                id: administradorId,
                estado: true,
              },
            },
          );

        if (!administrador) {
          throw new NotFoundException(
            "El administrador o secretaria no existe.",
          );
        }

        const turno =
          await manager
            .getRepository(
              TurnoVehiculo,
            )
            .createQueryBuilder(
              "turno",
            )
            .setLock(
              "pessimistic_write",
              undefined,
              ["turno"],
            )
            .where(
              "turno.id = :turnoId",
              {
                turnoId,
              },
            )
            .getOne();

        if (!turno) {
          throw new NotFoundException(
            "El turno seleccionado no existe.",
          );
        }

        const turnoCompleto =
          await manager.findOne(
            TurnoVehiculo,
            {
              where: {
                id: turno.id,
              },
              relations: {
                viaje: true,
                ruta: true,
                vehiculo: true,
              },
            },
          );

        if (!turnoCompleto) {
          throw new NotFoundException(
            "No se pudo cargar la información del turno.",
          );
        }

        if (
          turnoCompleto.estado !==
            EstadoTurnoVehiculo.VENDIENDO &&
          turnoCompleto.estado !==
            EstadoTurnoVehiculo.COMPLETO
        ) {
          throw new BadRequestException(
            "Este vehículo no está habilitado para salir.",
          );
        }

        turnoCompleto.estado =
          EstadoTurnoVehiculo.EN_RUTA;

        turnoCompleto.fechaSalida =
          new Date();

        turnoCompleto.viaje.estado =
          EstadoViaje.EN_CURSO;

        turnoCompleto.viaje.horaSalida =
          this.obtenerHoraActual();

        await manager.save(
          Viaje,
          turnoCompleto.viaje,
        );

        await manager.save(
          TurnoVehiculo,
          turnoCompleto,
        );

        await this.reordenarEstados(
          manager,
          turnoCompleto.ruta.id,
          turnoCompleto.fecha,
        );
      },
    );

    return {
      mensaje:
        "Salida autorizada correctamente. El siguiente vehículo ya está disponible.",
    };
  }

  /**
   * Revisa si el vehículo actual se llenó
   * y habilita al siguiente.
   */
  async sincronizarFila(
    rutaId: string,
    fecha: string,
  ): Promise<void> {
    await this.dataSource.transaction(
      async (manager) => {
        const turnoActual =
          await manager.findOne(
            TurnoVehiculo,
            {
              where: {
                ruta: {
                  id: rutaId,
                },
                fecha,
                estado:
                  EstadoTurnoVehiculo.VENDIENDO,
                activo: true,
              },
              relations: {
                ruta: true,
                viaje: true,
                vehiculo: true,
              },
            },
          );

        if (!turnoActual) {
          await this.reordenarEstados(
            manager,
            rutaId,
            fecha,
          );

          return;
        }

        const asientosConfirmados =
          await manager.count(
            AsientoViaje,
            {
              where: {
                viaje: {
                  id:
                    turnoActual
                      .viaje.id,
                },
                estado: In([
                  EstadoAsientoViaje.RESERVADO,
                  EstadoAsientoViaje.VENDIDO,
                ]),
              },
            },
          );

        const capacidad =
          Number(
            turnoActual
              .vehiculo.capacidad,
          );

        if (
          asientosConfirmados >=
          capacidad
        ) {
          turnoActual.estado =
            EstadoTurnoVehiculo.COMPLETO;

          await manager.save(
            TurnoVehiculo,
            turnoActual,
          );

          await this.reordenarEstados(
            manager,
            rutaId,
            fecha,
          );
        }
      },
    );
  }

  /**
   * Registra una solicitud para recoger
   * al pasajero durante el recorrido.
   */
  async solicitarRecojo(
    dto: SolicitarRecojoDto,
  ) {
    const usuario =
      await this.dataSource
        .getRepository(Usuario)
        .findOne({
          where: {
            id: dto.usuarioId,
            estado: true,
          },
        });

    if (!usuario) {
      throw new NotFoundException(
        "El usuario seleccionado no existe.",
      );
    }

    const viaje =
      await this.dataSource
        .getRepository(Viaje)
        .findOne({
          where: {
            id: dto.viajeId,
          },
          relations: {
            vehiculo: true,
            ruta: true,
          },
        });

    if (!viaje) {
      throw new NotFoundException(
        "El viaje seleccionado no existe.",
      );
    }

    if (
      !esVehiculoSectorRapido(
        viaje.vehiculo.tipo,
      )
    ) {
      throw new BadRequestException(
        "El recojo en camino solamente está disponible para Noah y Hiace.",
      );
    }

    const solicitudExistente =
      await this.recojosRepository.findOne({
        where: {
          usuario: {
            id: dto.usuarioId,
          },
          viaje: {
            id: dto.viajeId,
          },
          estado: In([
            EstadoSolicitudRecojo.PENDIENTE,
            EstadoSolicitudRecojo.CONFIRMADA,
          ]),
        },
      });

    if (solicitudExistente) {
      throw new ConflictException(
        "Ya tienes una solicitud de recojo activa para este viaje.",
      );
    }

    const solicitud =
      this.recojosRepository.create({
        usuario,
        viaje,
        referencia:
          dto.referencia.trim(),
        telefono:
          dto.telefono.trim(),
        latitud:
          dto.latitud ?? null,
        longitud:
          dto.longitud ?? null,
        observacion:
          dto.observacion?.trim() ||
          null,
        estado:
          EstadoSolicitudRecojo.PENDIENTE,
        confirmadoPor:
          null,
        fechaConfirmacion:
          null,
      });

    const guardada =
      await this.recojosRepository.save(
        solicitud,
      );

    return {
      mensaje:
        "La solicitud de recojo fue registrada correctamente.",
      solicitud:
        guardada,
    };
  }

  async listarSolicitudesPorViaje(
    viajeId: string,
  ) {
    return this.recojosRepository.find({
      where: {
        viaje: {
          id: viajeId,
        },
      },
      relations: {
        usuario: true,
        viaje: true,
      },
      order: {
        fechaRegistro: "DESC",
      },
    });
  }

  async actualizarEstadoRecojo(
    solicitudId: string,
    dto: ActualizarEstadoRecojoDto,
  ) {
    if (
      dto.estado ===
      EstadoSolicitudRecojo.PENDIENTE
    ) {
      throw new BadRequestException(
        "No se puede devolver una solicitud al estado PENDIENTE.",
      );
    }

    const administrador =
      await this.dataSource
        .getRepository(Usuario)
        .findOne({
          where: {
            id: dto.administradorId,
            estado: true,
          },
        });

    if (!administrador) {
      throw new NotFoundException(
        "El administrador o secretaria no existe.",
      );
    }

    const solicitud =
      await this.recojosRepository.findOne({
        where: {
          id: solicitudId,
        },
        relations: {
          usuario: true,
          viaje: true,
        },
      });

    if (!solicitud) {
      throw new NotFoundException(
        "La solicitud de recojo no existe.",
      );
    }

    solicitud.estado =
      dto.estado;

    solicitud.confirmadoPor =
      dto.administradorId;

    solicitud.fechaConfirmacion =
      new Date();

    const guardada =
      await this.recojosRepository.save(
        solicitud,
      );

    return {
      mensaje:
        "El estado del recojo fue actualizado correctamente.",
      solicitud:
        guardada,
    };
  }

  /**
   * Asigna VENDIENDO al primer vehículo
   * pendiente y SIGUIENTE al segundo.
   */
  private async reordenarEstados(
    manager:
      import("typeorm").EntityManager,
    rutaId: string,
    fecha: string,
  ): Promise<void> {
    const turnos =
      await manager.find(
        TurnoVehiculo,
        {
          where: {
            ruta: {
              id: rutaId,
            },
            fecha,
            activo: true,
          },
          relations: {
            ruta: true,
          },
          order: {
            posicion: "ASC",
          },
        },
      );

    const pendientes =
      turnos.filter(
        (turno) =>
          turno.estado !==
            EstadoTurnoVehiculo.COMPLETO &&
          turno.estado !==
            EstadoTurnoVehiculo.EN_RUTA &&
          turno.estado !==
            EstadoTurnoVehiculo.FINALIZADO &&
          turno.estado !==
            EstadoTurnoVehiculo.CANCELADO,
      );

    for (
      let indice = 0;
      indice < pendientes.length;
      indice += 1
    ) {
      const turno =
        pendientes[indice];

      if (indice === 0) {
        turno.estado =
          EstadoTurnoVehiculo.VENDIENDO;

        turno.fechaInicioVenta =
          turno.fechaInicioVenta ??
          new Date();
      } else if (indice === 1) {
        turno.estado =
          EstadoTurnoVehiculo.SIGUIENTE;
      } else {
        turno.estado =
          EstadoTurnoVehiculo.EN_ESPERA;
      }
    }

    if (pendientes.length > 0) {
      await manager.save(
        TurnoVehiculo,
        pendientes,
      );
    }
  }

  /**
   * Libera los bloqueos de asiento
   * que superaron los diez minutos.
   */
  private async liberarBloqueosVencidos():
    Promise<void> {
    await this.dataSource
      .getRepository(AsientoViaje)
      .createQueryBuilder()
      .update(AsientoViaje)
      .set({
        estado:
          EstadoAsientoViaje.DISPONIBLE,
        bloqueadoPor: null,
        bloqueadoHasta: null,
      })
      .where(
        "estado = :estado",
        {
          estado:
            EstadoAsientoViaje.BLOQUEADO,
        },
      )
      .andWhere(
        "bloqueado_hasta IS NOT NULL",
      )
      .andWhere(
        "bloqueado_hasta <= :ahora",
        {
          ahora: new Date(),
        },
      )
      .execute();
  }

  private normalizarHora(
    hora?: string,
  ): string {
    if (!hora) {
      return this.obtenerHoraActual();
    }

    return hora.length === 5
      ? `${hora}:00`
      : hora;
  }

  /**
   * Calcula la hora aproximada de cada
   * vehículo según su posición en la fila.
   */
  private sumarMinutosHora(
    hora: string,
    minutosAgregar: number,
  ): string {
    const partes = hora.split(":");

    const horas =
      Number(partes[0] ?? 0);

    const minutos =
      Number(partes[1] ?? 0);

    const minutosTotales =
      horas * 60 +
      minutos +
      minutosAgregar;

    const minutosDelDia = 24 * 60;

    const totalNormalizado =
      ((minutosTotales % minutosDelDia) +
        minutosDelDia) %
      minutosDelDia;

    const nuevaHora =
      Math.floor(
        totalNormalizado / 60,
      );

    const nuevosMinutos =
      totalNormalizado % 60;

    return `${String(nuevaHora).padStart(
      2,
      "0",
    )}:${String(nuevosMinutos).padStart(
      2,
      "0",
    )}:00`;
  }

  private obtenerHoraActual():
    string {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "America/La_Paz",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      },
    ).format(new Date());
  }
}
