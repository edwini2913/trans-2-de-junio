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

/*
 * PÁGINAS PÚBLICAS
 */

const Home = lazy(
  () => import("./pages/Home"),
);

const Login = lazy(
  () => import("./pages/auth/Login"),
);

const Register = lazy(
  () => import("./pages/auth/Register"),
);

/*
 * PÁGINAS DEL PASAJERO
 */

const DashboardPasajero = lazy(
  () => import("./pages/pasajero/Dashboard"),
);

const BuscarViajes = lazy(
  () =>
    import("./pages/pasajero/BuscarViajes"),
);

const ComprarPasaje = lazy(
  () =>
    import("./pages/pasajero/ComprarPasaje"),
);

const ComprarReservar = lazy(
  () =>
    import(
      "./pages/pasajero/ComprarReservar"
    ),
);

const MisReservas = lazy(
  () =>
    import("./pages/pasajero/MisReservas"),
);

const MisReclamos = lazy(
  () =>
    import("./pages/usuario/MisReclamos"),
);

/*
 * ESCÁNER DE TICKETS
 */

const EscanearTicket = lazy(
  () =>
    import("./pages/chofer/EscanearTicket"),
);

/*
 * PANEL ADMINISTRATIVO
 */

const AdminLayout = lazy(
  () => import("./layouts/AdminLayout"),
);

const DashboardAdmin = lazy(
  () => import("./pages/admin/Dashboard"),
);

const Usuarios = lazy(
  () => import("./pages/admin/Usuarios"),
);

const VentaOficina = lazy(
  () => import("./pages/admin/VentaOficina"),
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
  () =>
    import("./pages/admin/rutas/RutasPage"),
);

const Configuracion = lazy(
  () =>
    import("./pages/admin/Configuracion"),
);

interface RutaConProteccionProps {
  rolesPermitidos: string[];
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

function RutasAplicacion() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PÁGINAS PÚBLICAS */}

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

        {/* RUTAS DEL PASAJERO */}

        <Route
          path="/pasajero"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <DashboardPasajero />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/buscar-viajes"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <BuscarViajes />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/comprar"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <ComprarPasaje />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/comprar-reservar"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <ComprarReservar />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/mis-reservas"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <MisReservas />
            </RutaConProteccion>
          }
        />

        <Route
          path="/pasajero/mis-reclamos"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "PASAJERO",
              ]}
            >
              <MisReclamos />
            </RutaConProteccion>
          }
        />

        {/* ESCÁNER DE TICKETS */}

        <Route
          path="/chofer/escanear-ticket"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "ADMINISTRADOR",
                "SECRETARIA",
                "CHOFER",
              ]}
            >
              <EscanearTicket />
            </RutaConProteccion>
          }
        />

        {/* PANEL ADMINISTRATIVO */}

        <Route
          path="/admin"
          element={
            <RutaConProteccion
              rolesPermitidos={[
                "ADMINISTRADOR",
                "SECRETARIA",
              ]}
            >
              <AdminLayout />
            </RutaConProteccion>
          }
        >
          <Route
            index
            element={<DashboardAdmin />}
          />

          <Route
            path="usuarios"
            element={<Usuarios />}
          />

          <Route
            path="venta-oficina"
            element={<VentaOficina />}
          />

          <Route
            path="pagos"
            element={
              <RutaConProteccion
                rolesPermitidos={[
                  "ADMINISTRADOR",
                ]}
              >
                <Pagos />
              </RutaConProteccion>
            }
          />

          <Route
            path="pagos/:pagoId"
            element={
              <RutaConProteccion
                rolesPermitidos={[
                  "ADMINISTRADOR",
                ]}
              >
                <Pagos />
              </RutaConProteccion>
            }
          />

          <Route
            path="reportes"
            element={<Reportes />}
          />

          <Route
            path="blockchain"
            element={<Blockchain />}
          />

          <Route
            path="auditoria"
            element={
              <RutaConProteccion
                rolesPermitidos={[
                  "ADMINISTRADOR",
                ]}
              >
                <Auditoria />
              </RutaConProteccion>
            }
          />

          <Route
            path="reclamos"
            element={<Reclamos />}
          />

          <Route
            path="reclamos/:reclamoId"
            element={<Reclamos />}
          />

          <Route
            path="viajes-rutas"
            element={<ViajesRutas />}
          />

          <Route
            path="viajes-rutas/rutas"
            element={<RutasPage />}
          />

          <Route
            path="configuracion"
            element={
              <RutaConProteccion
                rolesPermitidos={[
                  "ADMINISTRADOR",
                ]}
              >
                <Configuracion />
              </RutaConProteccion>
            }
          />

          <Route
            path="crear-viaje"
            element={
              <Navigate
                to="/admin/viajes-rutas"
                replace
              />
            }
          />

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

        {/* RUTA GENERAL DESCONOCIDA */}

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