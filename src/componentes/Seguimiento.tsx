import { useState } from 'react';

import { api, ErrorApi } from '../api/cliente';
import type { EstadoTarea, Informe, TareaEnCurso } from '../api/tipos';
import { formatearPesos } from './Piezas';

interface Props {
  informe: Informe;
  onCambio: (informe: Informe) => void;
}

/**
 * Qué pasó después de mandar la propuesta.
 *
 * Es la parte que antes vivía en la cabeza del vendedor: si el comercio
 * contestó, qué se le prometió y cuánto de eso está hecho. Sin esto una
 * auditoría termina en "enviada" y nadie sabe, tres semanas después, cuáles
 * cerraron ni qué falta entregar de las que sí.
 */
export function Seguimiento({ informe, onCambio }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [rechazando, setRechazando] = useState(false);

  const correr = async (clave: string, accion: () => Promise<Informe>) => {
    setOcupado(clave);
    setError(null);
    try {
      onCambio(await accion());
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo guardar el cambio.');
    } finally {
      setOcupado(null);
    }
  };

  const seguimiento = informe.seguimiento;
  const cerrado = seguimiento !== null && seguimiento.tareas.length > 0;
  const rechazado = seguimiento !== null && seguimiento.motivoRechazo !== null;

  // Todavía no hubo respuesta del cliente: lo único que hace falta es poder
  // registrarla. No se muestra antes de tener el informe completo porque un
  // presupuesto armado sobre un diagnóstico a medias cotiza cualquier cosa.
  if (!cerrado && !rechazado) {
    if (informe.provisional) {
      return (
        <div className="tarjeta">
          <h2>Todavía no hay nada que seguir</h2>
          <p className="sub" style={{ marginTop: -4, maxWidth: '62ch' }}>
            Faltan responder {informe.senalesPendientes} señales. Hasta que el diagnóstico esté
            completo el presupuesto cotiza servicios que quizá no hagan falta, así que no se puede
            cerrar con el cliente.
          </p>
        </div>
      );
    }

    return (
      <div className="tarjeta">
        <h2>¿Qué contestó el cliente?</h2>
        <p className="sub" style={{ marginTop: -4, maxWidth: '62ch' }}>
          Al aceptar, el presupuesto queda congelado con los precios de hoy y cada servicio incluido
          se convierte en una tarea para seguir.
        </p>

        {error && <div className="aviso error">{error}</div>}

        {!rechazando ? (
          <div className="acciones" style={{ marginTop: 14 }}>
            <button
              className="boton"
              disabled={ocupado !== null}
              onClick={() => void correr('aceptar', () => api.aceptarPropuesta(informe.id))}
            >
              {ocupado === 'aceptar' ? 'Guardando...' : 'Aceptó el presupuesto'}
            </button>
            <button className="boton fantasma" onClick={() => setRechazando(true)}>
              No avanzó
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <label htmlFor="motivo-rechazo">¿Por qué no avanzó?</label>
            <input
              id="motivo-rechazo"
              type="text"
              maxLength={400}
              value={motivo}
              placeholder="Le pareció caro el sitio, lo va a ver el mes que viene..."
              onChange={(e) => setMotivo(e.target.value)}
            />
            <p className="ayuda">
              Una propuesta perdida sin razón anotada no enseña nada. Con razón, dentro de unos meses
              se ve si el problema es el precio, el momento o el argumento.
            </p>
            <div className="acciones" style={{ marginTop: 10 }}>
              <button
                className="boton"
                disabled={motivo.trim().length === 0 || ocupado !== null}
                onClick={() =>
                  void correr('rechazar', () => api.rechazarPropuesta(informe.id, motivo.trim()))
                }
              >
                {ocupado === 'rechazar' ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="boton fantasma" onClick={() => setRechazando(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (rechazado && seguimiento) {
    return (
      <div className="tarjeta">
        <h2>No avanzó</h2>
        <p className="sub" style={{ marginTop: -4 }}>
          {seguimiento.motivoRechazo}
          {seguimiento.rechazadaEn && ` · ${fecha(seguimiento.rechazadaEn)}`}
        </p>

        {error && <div className="aviso error">{error}</div>}

        <p className="ayuda solo-pantalla" style={{ marginTop: 12 }}>
          Si el cliente vuelve, se puede cerrar igual: el presupuesto se congela con los precios que
          tenga en ese momento.
        </p>
        <button
          className="boton fantasma solo-pantalla"
          disabled={ocupado !== null}
          onClick={() => void correr('aceptar', () => api.aceptarPropuesta(informe.id))}
        >
          {ocupado === 'aceptar' ? 'Guardando...' : 'Al final aceptó'}
        </button>
      </div>
    );
  }

  if (!seguimiento) return null;

  const entregadas = seguimiento.tareas.filter((t) => t.cumplida).length;

  return (
    <div className="tarjeta">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Trabajo contratado</h2>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          {entregadas} de {seguimiento.tareas.length} · {informe.estado}
        </span>
      </div>

      {error && <div className="aviso error">{error}</div>}

      <div className="pista" style={{ marginBottom: 16 }}>
        <div
          className="lleno"
          style={{
            width: `${Math.max(2, seguimiento.avance)}%`,
            background: seguimiento.avance === 100 ? 'var(--referente)' : 'var(--accent)',
          }}
        />
      </div>

      {seguimiento.tareas.map((tarea) => (
        <LineaDeTarea
          key={tarea.codigoServicio}
          tarea={tarea}
          guardando={ocupado === tarea.codigoServicio}
          onCambiar={(estado, nota) =>
            void correr(tarea.codigoServicio, () =>
              api.cambiarEstadoDeTarea(informe.id, tarea.codigoServicio, estado, nota),
            )
          }
        />
      ))}

      <div className="tiles" style={{ marginTop: 16, marginBottom: 0 }}>
        <div className="tile">
          <div className="tile-l">Avance</div>
          <div className="tile-v">{seguimiento.avance}%</div>
        </div>
        <div className="tile">
          <div className="tile-l">Pago único acordado</div>
          <div className="tile-v">{formatearPesos(seguimiento.totalUnicoContratado)}</div>
        </div>
        <div className="tile">
          <div className="tile-l">Mensual acordado</div>
          <div className="tile-v">{formatearPesos(seguimiento.totalMensualContratado)}</div>
        </div>
        <div className="tile">
          <div className="tile-l">{seguimiento.entregadaEn ? 'Entregado' : 'Cerrado'}</div>
          <div className="tile-v" style={{ fontSize: 15 }}>
            {fecha(seguimiento.entregadaEn ?? seguimiento.aceptadaEn)}
          </div>
        </div>
      </div>

      <p className="ayuda solo-pantalla" style={{ marginTop: 12 }}>
        Marcar una tarea como entregada no cambia el puntaje de la auditoría: el sistema no da por
        cumplido lo que nadie verificó. Para mostrarle al cliente que subió, auditalo de nuevo cuando
        el trabajo esté hecho.
      </p>
    </div>
  );
}

interface LineaProps {
  tarea: TareaEnCurso;
  guardando: boolean;
  onCambiar: (estado: EstadoTarea, nota: string | null) => void;
}

function LineaDeTarea({ tarea, guardando, onCambiar }: LineaProps) {
  const [nota, setNota] = useState(tarea.nota ?? '');

  return (
    <div
      className="servicio"
      style={{
        opacity: tarea.cumplida ? 1 : 0.82,
        borderColor: tarea.cumplida ? 'var(--referente)' : 'var(--border-soft)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3>{tarea.nombre}</h3>
        <p>
          {formatearPesos(tarea.precio)}{' '}
          {tarea.modalidad === 'MENSUAL' ? 'por mes' : `· único · ${tarea.plazoDias} días`}
          {tarea.completadaEn && ` · ${fecha(tarea.completadaEn)}`}
        </p>

        <input
          type="text"
          className="solo-pantalla"
          maxLength={400}
          value={nota}
          placeholder="Nota (opcional)"
          disabled={guardando}
          onChange={(e) => setNota(e.target.value)}
          onBlur={() => nota !== (tarea.nota ?? '') && onCambiar(tarea.estado, nota)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Nota de ${tarea.nombre}`}
          style={{ marginTop: 8, fontSize: 13, padding: '5px 8px' }}
        />
        {tarea.nota && <p className="solo-impresion">{tarea.nota}</p>}
      </div>

      <div>
        <span className="solo-impresion">{tarea.estadoEtiqueta}</span>

        <div
          className="solo-pantalla"
          role="group"
          aria-label={`Estado de ${tarea.nombre}`}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          {tarea.opciones.map((opcion) => (
            <button
              key={opcion.estado}
              type="button"
              className={`boton ${tarea.estado === opcion.estado ? '' : 'fantasma'}`}
              disabled={guardando}
              aria-pressed={tarea.estado === opcion.estado}
              onClick={() => onCambiar(opcion.estado, nota || null)}
              style={{ padding: '5px 10px', fontSize: 12.5 }}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function fecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
