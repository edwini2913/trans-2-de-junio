import {
  BusFront,
  CarFront,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Users,
} from 'lucide-react';

import type {
  HorarioDisponible,
  VehiculoDisponible,
} from '../../services/viajes.service';

interface SeleccionHorarioVehiculoProps {
  horarios: HorarioDisponible[];
  horarioSeleccionado: string;
  vehiculoSeleccionado: VehiculoDisponible | null;
  cargando: boolean;
  bloqueado?: boolean;

  onSeleccionarHorario: (
    horaSalida: string,
  ) => void;

  onSeleccionarVehiculo: (
    vehiculo: VehiculoDisponible,
  ) => void;
}

function formatearHora(hora: string): string {
  if (!hora) {
    return '--:--';
  }

  return hora.slice(0, 5);
}

function formatearPrecio(precio: number): string {
  const valor = Number(precio || 0);

  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function obtenerNombreVehiculo(
  vehiculo: VehiculoDisponible,
): string {
  if (vehiculo.tipo === 'FLOTA') {
    return 'Flota';
  }

  return 'Toyota Noah';
}

export default function SeleccionHorarioVehiculo({
  horarios,
  horarioSeleccionado,
  vehiculoSeleccionado,
  cargando,
  bloqueado = false,
  onSeleccionarHorario,
  onSeleccionarVehiculo,
}: SeleccionHorarioVehiculoProps) {
  const horarioActivo =
    horarios.find(
      (horario) =>
        horario.horaSalida === horarioSeleccionado,
    ) || null;

  if (cargando) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-44 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />

            <p className="text-sm font-semibold">
              Buscando horarios y vehículos disponibles...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (horarios.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Clock3 className="h-7 w-7 text-slate-500" />
        </div>

        <h3 className="mt-4 text-lg font-black text-slate-900">
          No hay salidas disponibles
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Selecciona otra ruta o una fecha diferente.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
            <Clock3 className="h-6 w-6 text-blue-700" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Selecciona tu horario
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              En cada horario encontrarás tres flotas y
              dos vehículos Noah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {horarios.map((horario) => {
            const seleccionado =
              horario.horaSalida ===
              horarioSeleccionado;

            return (
              <button
                key={horario.horaSalida}
                type="button"
                disabled={bloqueado}
                onClick={() =>
                  onSeleccionarHorario(
                    horario.horaSalida,
                  )
                }
                className={[
                  'relative rounded-2xl border px-4 py-4 text-left transition',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  seleccionado
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50',
                ].join(' ')}
              >
                {seleccionado && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5" />
                )}

                <span
                  className={[
                    'block text-xs font-bold uppercase tracking-wide',
                    seleccionado
                      ? 'text-blue-100'
                      : 'text-slate-500',
                  ].join(' ')}
                >
                  Salida
                </span>

                <strong className="mt-1 block text-2xl font-black">
                  {formatearHora(
                    horario.horaSalida,
                  )}
                </strong>

                <span
                  className={[
                    'mt-2 block text-xs font-semibold',
                    seleccionado
                      ? 'text-blue-100'
                      : 'text-slate-500',
                  ].join(' ')}
                >
                  {horario.cantidadVehiculos}{' '}
                  vehículos disponibles
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {horarioActivo && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900">
              Elige el vehículo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Salida seleccionada:{' '}
              <strong className="text-blue-700">
                {formatearHora(
                  horarioActivo.horaSalida,
                )}
              </strong>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {horarioActivo.vehiculos.map(
              (vehiculo) => {
                const seleccionado =
                  vehiculoSeleccionado?.viajeId ===
                  vehiculo.viajeId;

                const esFlota =
                  vehiculo.tipo === 'FLOTA';

                return (
                  <button
                    key={vehiculo.viajeId}
                    type="button"
                    disabled={
                      bloqueado ||
                      vehiculo.asientosDisponibles <= 0
                    }
                    onClick={() =>
                      onSeleccionarVehiculo(
                        vehiculo,
                      )
                    }
                    className={[
                      'relative overflow-hidden rounded-3xl border p-5 text-left transition',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      seleccionado
                        ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'absolute inset-x-0 top-0 h-1.5',
                        esFlota
                          ? 'bg-blue-600'
                          : 'bg-emerald-500',
                      ].join(' ')}
                    />

                    {seleccionado && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-900">
                        <CheckCircle2 className="h-4 w-4" />
                        Elegido
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                          esFlota
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700',
                        ].join(' ')}
                      >
                        {esFlota ? (
                          <BusFront className="h-8 w-8" />
                        ) : (
                          <CarFront className="h-8 w-8" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-black',
                            esFlota
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700',
                          ].join(' ')}
                        >
                          {obtenerNombreVehiculo(
                            vehiculo,
                          )}
                        </span>

                        <h3 className="mt-2 truncate text-lg font-black text-slate-900">
                          {vehiculo.marca}{' '}
                          {vehiculo.modelo}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Placa: {vehiculo.placa}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users className="h-4 w-4" />

                          <span className="text-xs font-bold">
                            Disponibles
                          </span>
                        </div>

                        <strong className="mt-1 block text-lg font-black text-slate-900">
                          {
                            vehiculo.asientosDisponibles
                          }{' '}
                          de {vehiculo.capacidad}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <span className="text-xs font-bold text-slate-500">
                          Precio
                        </span>

                        <strong className="mt-1 block text-lg font-black text-blue-700">
                          Bs{' '}
                          {formatearPrecio(
                            vehiculo.precio,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={[
                        'mt-4 rounded-2xl px-4 py-3 text-center text-sm font-black',
                        seleccionado
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-slate-900 text-white',
                      ].join(' ')}
                    >
                      {seleccionado
                        ? 'Vehículo seleccionado'
                        : vehiculo.asientosDisponibles > 0
                          ? 'Elegir este vehículo'
                          : 'Sin asientos disponibles'}
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}