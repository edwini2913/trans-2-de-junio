import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TipoAccionAuditoria {
  INICIO_SESION = 'INICIO_SESION',
  CIERRE_SESION = 'CIERRE_SESION',

  CREAR = 'CREAR',
  CONSULTAR = 'CONSULTAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',

  APROBAR = 'APROBAR',
  RECHAZAR = 'RECHAZAR',
  CANCELAR = 'CANCELAR',

  RESERVAR = 'RESERVAR',
  COMPRAR = 'COMPRAR',
  PAGAR = 'PAGAR',

  GENERAR_TICKET = 'GENERAR_TICKET',
  VALIDAR_TICKET = 'VALIDAR_TICKET',

  ESCANEAR_QR = 'ESCANEAR_QR',
  REGISTRAR_BLOCKCHAIN = 'REGISTRAR_BLOCKCHAIN',

  CAMBIAR_CONFIGURACION = 'CAMBIAR_CONFIGURACION',

  OTRA = 'OTRA',
}

export enum ResultadoAuditoria {
  EXITOSO = 'EXITOSO',
  FALLIDO = 'FALLIDO',
}

@Entity({
  schema: 'sistema',
  name: 'auditorias',
})
@Index('IDX_AUDITORIA_USUARIO_ID', [
  'usuarioId',
])
@Index('IDX_AUDITORIA_ACCION', [
  'accion',
])
@Index('IDX_AUDITORIA_MODULO', [
  'modulo',
])
@Index('IDX_AUDITORIA_RESULTADO', [
  'resultado',
])
@Index('IDX_AUDITORIA_FECHA', [
  'fechaRegistro',
])
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'usuario_id',
    type: 'uuid',
    nullable: true,
  })
  usuarioId!: string | null;

  @Column({
    name: 'usuario_nombre',
    type: 'varchar',
    length: 180,
    nullable: true,
  })
  usuarioNombre!: string | null;

  @Column({
    name: 'usuario_email',
    type: 'varchar',
    length: 180,
    nullable: true,
  })
  usuarioEmail!: string | null;

  @Column({
    name: 'usuario_rol',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  usuarioRol!: string | null;

  @Column({
    type: 'enum',
    enum: TipoAccionAuditoria,
    enumName: 'tipo_accion_auditoria',
  })
  accion!: TipoAccionAuditoria;

  @Column({
    type: 'varchar',
    length: 100,
  })
  modulo!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  descripcion!: string;

  @Column({
    name: 'entidad',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entidad!: string | null;

  @Column({
    name: 'entidad_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entidadId!: string | null;

  @Column({
    type: 'enum',
    enum: ResultadoAuditoria,
    enumName: 'resultado_auditoria',
    default: ResultadoAuditoria.EXITOSO,
  })
  resultado!: ResultadoAuditoria;

  @Column({
    name: 'datos_anteriores',
    type: 'jsonb',
    nullable: true,
  })
  datosAnteriores!: Record<
    string,
    unknown
  > | null;

  @Column({
    name: 'datos_nuevos',
    type: 'jsonb',
    nullable: true,
  })
  datosNuevos!: Record<
    string,
    unknown
  > | null;

  @Column({
    name: 'informacion_adicional',
    type: 'jsonb',
    nullable: true,
  })
  informacionAdicional!: Record<
    string,
    unknown
  > | null;

  @Column({
    name: 'direccion_ip',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  direccionIp!: string | null;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent!: string | null;

  @Column({
    name: 'metodo_http',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  metodoHttp!: string | null;

  @Column({
    name: 'ruta_http',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  rutaHttp!: string | null;

  @Column({
    name: 'mensaje_error',
    type: 'text',
    nullable: true,
  })
  mensajeError!: string | null;

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp with time zone',
  })
  fechaRegistro!: Date;
}