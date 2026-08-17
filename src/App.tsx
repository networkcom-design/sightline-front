import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';

import { ProveedorDeSesion, useSesion } from './auth/Sesion';
import { Logo } from './componentes/Piezas';
import { Evidencia } from './paginas/Evidencia';
import { InformePagina } from './paginas/InformePagina';
import { Ingreso } from './paginas/Ingreso';
import { NuevaAuditoria } from './paginas/NuevaAuditoria';
import { Panel } from './paginas/Panel';
import { Publico } from './paginas/Publico';
import { Revision } from './paginas/Revision';

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorDeSesion>
        <Routes>
          {/* El informe del prospecto va fuera de la sesión: se abre sin cuenta. */}
          <Route path="/informe/:token" element={<Publico />} />
          <Route path="/*" element={<Privado />} />
        </Routes>
      </ProveedorDeSesion>
    </BrowserRouter>
  );
}

function Privado() {
  const { usuario, cargando, salir } = useSesion();

  if (cargando) return <p className="cargando">Cargando...</p>;
  if (!usuario) return <Ingreso />;

  return (
    <div className="marco-app">
      <aside className="lateral">
        <div className="logo">
          <Logo tamano={20} />
          <span>Lupa</span>
        </div>

        <nav className="menu">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : '')}>
            Auditorías
          </NavLink>
          <NavLink
            to="/auditorias/nueva"
            className={({ isActive }) => (isActive ? 'activo' : '')}
          >
            Nueva auditoría
          </NavLink>
        </nav>

        <div className="pie-lateral">
          <div>
            {usuario.nombre}
            <br />
            {usuario.email}
          </div>
          <button className="boton fantasma" onClick={salir}>
            Salir
          </button>
        </div>
      </aside>

      <main className="contenido">
        <Routes>
          <Route path="/" element={<Panel />} />
          <Route path="/auditorias/nueva" element={<NuevaAuditoria />} />
          <Route path="/auditorias/:id" element={<InformePagina />} />
          <Route path="/auditorias/:id/evidencia" element={<Evidencia />} />
          <Route path="/auditorias/:id/revision" element={<Revision />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
