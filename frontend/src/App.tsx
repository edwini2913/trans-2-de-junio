
import {
  lazy,
  Suspense,
  type ReactNode,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import RutaProtegida from "./components/RutaProtegida";
import PageLoader from "./components/loaders/PageLoader";
import EstadoConexion from "./components/pwa/EstadoConexion";
import InstalarPWA from "./components/pwa/InstalarPWA";

/* =========================================
   ROLES DEL SISTEMA
========================================= */

type RolUsuario =
  | "ADMINISTRADOR"
  | "SECRETARIA"
  | "CHOFER"
  | "PASAJERO";

/* =========================================
   PERMISOS DEL PANEL ADMINISTRATIVO
========================================= */

const ROLES_ADMIN: RolUsuario[] = [
  "ADMINISTRADOR",
  "SECRETARIA",
];

/* =========================================
   PERMISOS DEL ESCÁNER QR

   ADMINISTRADOR: acceso completo
   CHOFER: requiere autorización del backend
========================================= */

const ROLES_ESCANER: RolUsuario[] = [
  "ADMINISTRADOR",
  "CHOFER",
];

/* =========================================
   ACCESO EXCLUSIVO DEL ADMINISTRADOR
========================================= */

const SOLO_ADMIN: RolUsuario[] = [
  "ADMINISTRADOR",
];

/* =========================================
   ACCESO EXCLUSIVO DEL PASAJERO
========================================= */

const SOLO_PASAJERO: RolUsuario[] = [
  "PASAJERO",
];

/* =========================================
   PÁGINAS PÚBLICAS
========================================= */

const Home = lazy(
  () => import("./pages/Home"),
);

const Login = lazy(
  () => import("./pages/auth/Login"),
);

const Register = lazy(
  () => import("./pages/auth/Register"),
);

const RecuperarPassword = lazy(
  () => import("./pages/auth/RecuperarPassword"),
);

const RestablecerPassword = lazy(
  () => import("./pages/auth/RestablecerPassword"),
);

/* =========================================
   PÁGINAS DEL PASAJERO
========================================= */

const DashboardPasajero = lazy(
  () => import("./pages/pasajero/Dashboard"),
);

const BuscarViajes = lazy(
  () => import("./pages/pasajero/BuscarViajes"),
);

const ComprarPasaje = lazy(
  () => import("./pages/pasajero/ComprarPasaje"),
);

const ComprarReservar = lazy(
  () => import("./pages/pasajero/ComprarReservar"),
);

const MisReservas = lazy(
  () => import("./pages/pasajero/MisReservas"),
);

const MisReclamos = lazy(
  () => import("./pages/usuario/MisReclamos"),
);

/* =========================================
   ESCÁNER DE TICKETS QR
========================================= */

const EscanearTicket = lazy(
  () => import("./pages/chofer/EscanearTicket"),
);

/* =========================================
   PANEL ADMINISTRATIVO
========================================= */

const AdminLayout = lazy(
  () => import("./layouts/AdminLayout"),
);

const DashboardAdmin = lazy(
  () => import("./pages/admin/Dashboard"),
);

const Usuarios = lazy(
  () => import("./pages/admin/Usuarios"),
);

const Choferes = lazy(
  () => import("./pages/admin/Choferes"),
);

const Vehiculos = lazy(
  () => import("./pages/admin/Vehiculos"),
);

const VentaOficina = lazy(
  () => import("./pages/admin/VentaOficina"),
);

const SalidasRapidas = lazy(
  () => import("./pages/admin/SalidasRapidas"),
);

const Pagos = lazy(
  () => import("./pages/admin/Pagos"),
);

const Reportes = lazy(
  () => import("./pages/admin/Reportes"),
);

const Blockchain = lazy(
  () => import("./pages/admin/Blockchain"),
);

const Auditoria = lazy(
  () => import("./pages/admin/Auditoria"),
);

const Reclamos = lazy(
  () => import("./pages/admin/Reclamos"),
);

const ViajesRutas = lazy(
  () => import("./pages/admin/ViajesRutas"),
);

const RutasPage = lazy(
  () => import("./pages/admin/rutas/RutasPage"),
);

const Configuracion = lazy(
  () => import("./pages/admin/Configuracion"),
);

/* =========================================
   COMPONENTE DE PROTECCIÓN DE RUTAS
========================================= */

interface RutaConProteccionProps {
  rolesPermitidos: RolUsuario[];
  children: ReactNode;
}

function RutaConProteccion({
  rolesPermitidos,
  children,
}: RutaConProteccionProps) {
  return (
    <RutaProtegida
      rolesPermitidos={rolesPermitidos}
    >
      {children}
    </RutaProtegida>
  );
}

/* =========================================
   RUTAS DE LA APLICACIÓN
========================================= */

function RutasAplicacion() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* =================================
            PÁGINAS PÚBLICAS
        ================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/recuperar-password"
          element={<RecuperarPassword />}
        />

        <Route
          path="/restablecer-password"
          element={<RestablecerPassword />}
        />

        {/* =================================
            PANEL DEL PASAJERO
        ================================= */}

        <Route
          path="/pasajero"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <DashboardPasajero />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/buscar-viajes"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <BuscarViajes />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/comprar"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <ComprarPasaje />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/comprar-reservar"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <ComprarReservar />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/mis-reservas"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <MisReservas />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/mis-reclamos"
          element={
            <RutaConProteccion
              rolesPermitidos={SOLO_PASAJERO}
            >
              <MisReclamos />
            </RutaConProteccion>
          }
        />

        {/* =================================
            ESCÁNER DE TICKETS QR

            ADMINISTRADOR Y CHOFER
        ================================= */}

        <Route
          path="/chofer/escanear-ticket"
          element={
            <RutaConProteccion
              rolesPermitidos={ROLES_ESCANER}
            >
              <EscanearTicket />
            </RutaConProteccion>
          }
        />

        {/* =================================
            PANEL ADMINISTRATIVO
        ================================= */}

        <Route
          path="/admin"
          element={
            <RutaConProteccion
              rolesPermitidos={ROLES_ADMIN}
            >
              <AdminLayout />
            </RutaConProteccion>
          }
        >

          {/* DASHBOARD */}

          <Route
            index
            element={<DashboardAdmin />}
          />

          {/* USUARIOS: SOLO ADMINISTRADOR */}

          <Route
            path="usuarios"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Usuarios />
              </RutaConProteccion>
            }
          />

          {/* =================================
              GESTIÓN DE CHOFERES

              SOLO ADMINISTRADOR
          ================================= */}

          <Route
            path="choferes"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Choferes />
              </RutaConProteccion>
            }
          />

          {/* VEHÍCULOS */}

          <Route
            path="vehiculos"
            element={<Vehiculos />}
          />

          {/* VENTA EN OFICINA */}

          <Route
            path="venta-oficina"
            element={<VentaOficina />}
          />

          {/* SALIDAS RÁPIDAS */}

          <Route
            path="salidas-rapidas"
            element={<SalidasRapidas />}
          />

          {/* =================================
              PAGOS QR

              SOLO ADMINISTRADOR
          ================================= */}

          <Route
            path="pagos"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Pagos />
              </RutaConProteccion>
            }
          />

          <Route
            path="pagos/:pagoId"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Pagos />
              </RutaConProteccion>
            }
          />

          {/* REPORTES */}

          <Route
            path="reportes"
            element={<Reportes />}
          />

          {/* BLOCKCHAIN */}

          <Route
            path="blockchain"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Blockchain />
              </RutaConProteccion>
            }
          />

          {/* AUDITORÍA */}

          <Route
            path="auditoria"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Auditoria />
              </RutaConProteccion>
            }
          />

          {/* RECLAMOS */}

          <Route
            path="reclamos"
            element={<Reclamos />}
          />

          <Route
            path="reclamos/:reclamoId"
            element={<Reclamos />}
          />

          {/* VIAJES Y RUTAS */}

          <Route
            path="viajes-rutas"
            element={<ViajesRutas />}
          />

          <Route
            path="viajes-rutas/rutas"
            element={<RutasPage />}
          />

          {/* CONFIGURACIÓN */}

          <Route
            path="configuracion"
            element={
              <RutaConProteccion
                rolesPermitidos={SOLO_ADMIN}
              >
                <Configuracion />
              </RutaConProteccion>
            }
          />

          {/* REDIRECCIÓN DE VIAJES */}

          <Route
            path="crear-viaje"
            element={
              <Navigate
                to="/admin/viajes-rutas"
                replace
              />
            }
          />

          {/* RUTA ADMIN DESCONOCIDA */}

          <Route
            path="*"
            element={
              <Navigate
                to="/admin"
                replace
              />
            }
          />
        </Route>

        {/* =================================
            RUTA GENERAL DESCONOCIDA
        ================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

/* =========================================
   COMPONENTE PRINCIPAL
========================================= */

function App() {
  return (
    <BrowserRouter>
      <RutasAplicacion />

      <EstadoConexion />

      <InstalarPWA />
    </BrowserRouter>
  );
}

export default App;
