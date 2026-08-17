import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { Resumen } from '../api/tipos';
import { ChipNivel } from '../componentes/Piezas';

export function Panel() {
  const navegar = useNavigate();
  const [auditorias, setAuditorias] = useState<Resumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listar()
      .then(setAuditorias)
      .catch((e) => setError(e instanceof ErrorApi ? e.message : 'No se pudieron cargar las auditorías.'));
  }, []);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Auditorías</h1>
          <p className="sub">
            {auditorias ? `${auditorias.length} en total` : 'Cargando...'}
          </p>
        </div>
        <Link className="boton" to="/auditorias/nueva">
          Nueva auditoría
        </Link>
      </div>

      {error && <div className="aviso error">{error}</div>}

      {!auditorias && !error && <p className="cargando">Cargando auditorías...</p>}

      {auditorias?.length === 0 && (
        <div className="tarjeta">
          <div className="vacio">
            <p style={{ margin: '0 0 14px' }}>
              Todavía no auditaste ningún comercio.
            </p>
            <Link className="boton" to="/auditorias/nueva">
              Empezar la primera
            </Link>
          </div>
        </div>
      )}

      {auditorias && auditorias.length > 0 && (
        <div className="tarjeta">
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Comercio</th>
                  <th>Rubro</th>
                  <th className="num">Puntaje</th>
                  <th>Nivel</th>
                  <th className="num">Avance</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.map((a) => (
                  <tr
                    key={a.id}
                    className="fila-clic"
                    onClick={() => navegar(`/auditorias/${a.id}`)}
                  >
                    <td style={{ fontWeight: 500 }}>{a.nombre}</td>
                    <td style={{ color: 'var(--muted)' }}>{a.rubro}</td>
                    <td className="num">{a.puntaje}</td>
                    <td>
                      <ChipNivel nivel={a.nivel} />
                    </td>
                    <td className="num" style={{ color: 'var(--muted)' }}>
                      {a.senalesRespondidas}/{a.senalesTotales}
                    </td>
                    <td>
                      <span className="chip neutro">{a.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
