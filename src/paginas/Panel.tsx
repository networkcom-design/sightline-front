import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { Resumen } from '../api/tipos';
import { ChipNivel } from '../componentes/Piezas';

/**
 * El color del estado.
 *
 * Solo se destacan los dos finales —cerrado y perdido—, que son los que se
 * buscan de un vistazo en una lista larga. Pintar los siete haría que ninguno
 * resalte, que es lo mismo que no pintar ninguno.
 */
const CLASE_POR_ESTADO: Record<string, string> = {
  Entregada: 'referente',
  'En ejecución': 'competitivo',
  Rechazada: 'critico',
};

const CON_TRABAJO = ['Aceptada', 'En ejecución', 'Entregada'];

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
                  <th className="num">Señales</th>
                  <th className="num">Trabajo</th>
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
                    {/* Vacío y no "0%" cuando no hay nada contratado: un cero
                        se lee como "arrancó y no avanzó", que es otra cosa. */}
                    <td className="num" style={{ color: 'var(--muted)' }}>
                      {CON_TRABAJO.includes(a.estado) ? `${a.avance}%` : '—'}
                    </td>
                    <td>
                      <span className={`chip ${CLASE_POR_ESTADO[a.estado] ?? 'neutro'}`}>
                        {a.estado}
                      </span>
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
