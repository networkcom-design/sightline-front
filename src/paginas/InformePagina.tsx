import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { Informe, ServicioSugerido } from '../api/tipos';
import { EnviarPropuesta } from '../componentes/EnviarPropuesta';
import { ComparativaDePuntaje, GraficoDimensiones, HallazgosPorImpacto } from '../componentes/Graficos';
import { Seguimiento } from '../componentes/Seguimiento';
import {
  ChipNivel,
  Medidor,
  Pasos,
  formatearMinutos,
  formatearPesos,
} from '../componentes/Piezas';

type Seccion = 'diagnostico' | 'propuesta' | 'seguimiento';

/**
 * Con qué pestaña abre el informe.
 *
 * Depende de en qué punto está el expediente: si ya hay trabajo contratado, lo
 * que el auditor viene a hacer es actualizar tareas, no releer el diagnóstico.
 */
function seccionInicial(informe: Informe): Seccion {
  if (informe.seguimiento) return 'seguimiento';
  if (informe.estado === 'Enviada') return 'seguimiento';
  return 'diagnostico';
}

function etiquetaDeSeguimiento(informe: Informe): string | undefined {
  const s = informe.seguimiento;
  if (!s) return undefined;
  if (s.motivoRechazo) return 'no avanzó';
  return `${s.avance}%`;
}

interface PestanaProps {
  nombre: string;
  detalle?: string;
  activa: boolean;
  onClic: () => void;
}

function Pestana({ nombre, detalle, activa, onClic }: PestanaProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      className={`pestana ${activa ? 'activa' : ''}`}
      onClick={onClic}
    >
      {nombre}
      {detalle && <small>{detalle}</small>}
    </button>
  );
}

export function InformePagina() {
  const { id = '' } = useParams();
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [seccion, setSeccion] = useState<Seccion | null>(null);

  useEffect(() => {
    api
      .informe(id)
      .then((datos) => {
        setInforme(datos);
        // La pestaña inicial se elige una sola vez, al cargar: si se
        // recalculara con cada respuesta del servidor, aceptar la propuesta
        // saltaría de pestaña sola y cambiar una tarea devolvería al auditor
        // a donde el código cree que tiene que estar, no donde estaba mirando.
        setSeccion((actual) => actual ?? seccionInicial(datos));
      })
      .catch((e) => setError(e instanceof ErrorApi ? e.message : 'No se pudo cargar el informe.'));
  }, [id]);

  const ajustar = async (codigo: string, incluido: boolean, precio: number | null) => {
    setAjustando(codigo);
    setError(null);
    try {
      setInforme(await api.ajustarServicio(id, codigo, incluido, precio));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo ajustar el presupuesto.');
    } finally {
      setAjustando(null);
    }
  };

  // Solo corta la página si nunca se pudo cargar. Un error al ajustar un precio
  // se muestra arriba sin hacer desaparecer el informe que el auditor está mirando.
  if (error && !informe) return <div className="aviso error">{error}</div>;
  if (!informe || !seccion) return <p className="cargando">Cargando informe...</p>;

  const enlacePublico = `${window.location.origin}/informe/${informe.tokenPublico}`;

  // Con el trato cerrado el presupuesto no se toca: lo que se pactó vive en las
  // tareas contratadas, con los precios congelados de ese día.
  const cerrada = (informe.seguimiento?.tareas.length ?? 0) > 0;

  const copiarEnlace = async () => {
    await navigator.clipboard.writeText(enlacePublico);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>{informe.nombre}</h1>
          <p className="sub">
            {informe.rubro}
            {informe.ciudad ? ` · ${informe.ciudad}` : ''} · {informe.cobertura}% de cobertura
          </p>
        </div>
        <div className="acciones">
          <Link className="boton fantasma" to={`/auditorias/${id}/revision`}>
            Editar señales
          </Link>
          <button className="boton fantasma" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="boton" onClick={copiarEnlace} disabled={informe.provisional}>
            {copiado ? 'Enlace copiado' : 'Copiar enlace para el cliente'}
          </button>
        </div>
      </div>

      <p className="solo-impresion" style={{ fontSize: '10pt', color: 'var(--muted)', margin: 0 }}>
        Informe interno · incluye horas estimadas y precios · no compartir con el cliente
      </p>

      <Pasos actual={4} />

      {error && <div className="aviso error">{error}</div>}

      {informe.provisional && (
        <div className="aviso atencion">
          <strong>Puntaje provisional.</strong> Faltan responder {informe.senalesPendientes} señales.
          El motor solo puntúa lo que se le contestó, así que este número está inflado y el enlace
          para el cliente queda bloqueado hasta completarlo.
        </div>
      )}

      <div className="pestanas solo-pantalla" role="tablist">
        <Pestana
          nombre="Diagnóstico"
          detalle={`${informe.planDeAccion.length} hallazgos`}
          activa={seccion === 'diagnostico'}
          onClic={() => setSeccion('diagnostico')}
        />
        <Pestana
          nombre="Propuesta"
          detalle={
            informe.propuesta.servicios.length > 0
              ? `${informe.propuesta.servicios.filter((s) => s.incluido).length} servicios`
              : undefined
          }
          activa={seccion === 'propuesta'}
          onClic={() => setSeccion('propuesta')}
        />
        <Pestana
          nombre="Seguimiento"
          detalle={etiquetaDeSeguimiento(informe)}
          activa={seccion === 'seguimiento'}
          onClic={() => setSeccion('seguimiento')}
        />
      </div>

      <section className={seccion === 'diagnostico' ? undefined : 'seccion-oculta'}>
      <div className="tarjeta">
        <div className="puntaje-bloque">
          <div>
            <div className="puntaje-grande">
              <b>{informe.puntaje}</b>
              <ChipNivel nivel={informe.nivel} />
            </div>
            <p className="sub" style={{ maxWidth: '34ch' }}>
              {informe.lecturaDelNivel}
            </p>
          </div>
          <Medidor puntaje={informe.puntaje} />
        </div>
      </div>

      <div className="tarjeta">
        <h2>Puntaje por dimensión</h2>
        <p className="sub" style={{ marginTop: -4, marginBottom: 14 }}>
          Ordenadas de peor a mejor: arriba está por dónde empezar.
        </p>
        <GraficoDimensiones dimensiones={informe.dimensiones} />
      </div>

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
          <h2 style={{ margin: 0 }}>Plan de acción</h2>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            {informe.planDeAccion.length} hallazgos ·{' '}
            {formatearMinutos(informe.minutosTotalesEstimados)} de trabajo
          </span>
        </div>

        {informe.planDeAccion.length === 0 ? (
          <p className="sub">No hay hallazgos: el comercio cumple todo lo evaluado.</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <HallazgosPorImpacto
                alto={informe.planDeAccion.filter((h) => h.impacto === 'Alto').length}
                medio={informe.planDeAccion.filter((h) => h.impacto === 'Medio').length}
                bajo={informe.planDeAccion.filter((h) => h.impacto === 'Bajo').length}
              />
            </div>
            <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Hallazgo</th>
                  <th>Impacto</th>
                  <th>Esfuerzo</th>
                  <th className="num">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {informe.planDeAccion.map((h) => (
                  <tr key={h.codigo}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{h.titulo}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{h.accion}</div>
                    </td>
                    <td>
                      <span className={`chip ${h.impacto === 'Alto' ? 'critico' : 'neutro'}`}>
                        {h.impacto}
                      </span>
                    </td>
                    <td>
                      <span className={`chip ${h.esfuerzo === 'Bajo' ? 'competitivo' : 'neutro'}`}>
                        {h.esfuerzo}
                      </span>
                    </td>
                    <td className="num">{formatearMinutos(h.minutosEstimados)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
      </section>

      <section className={seccion === 'propuesta' ? undefined : 'seccion-oculta'}>
      <div className="tarjeta">
        <h2>Propuesta</h2>

        {informe.propuesta.servicios.length === 0 ? (
          <p className="sub">No hay nada que vender: el comercio ya cumple todo.</p>
        ) : (
          <>
            <ComparativaDePuntaje
              actual={informe.propuesta.puntajeActual}
              alEntregar={informe.propuesta.puntajeAlEntregar}
              sostenido={informe.propuesta.puntajeSostenido}
            />

            <p className="sub" style={{ margin: '10px 0 18px', maxWidth: '62ch' }}>
              Al entregar sube {informe.propuesta.mejoraAlEntregar} puntos con el trabajo de pago
              único.
              {informe.propuesta.aporteDelAbono > 0 && (
                <>
                  {' '}
                  Los {informe.propuesta.aporteDelAbono} restantes dependen de sostener el abono:
                  publicar seguido y juntar reseñas no se entrega una vez, se mantiene.
                </>
              )}
            </p>

            {informe.propuesta.servicios.map((s) => (
              <LineaDeServicio
                key={s.codigo}
                servicio={s}
                guardando={ajustando === s.codigo}
                cerrada={cerrada}
                onAjustar={(incluido, precio) => ajustar(s.codigo, incluido, precio)}
              />
            ))}

            <p className="ayuda solo-pantalla" style={{ marginTop: 4 }}>
              {cerrada ? (
                <>
                  El cliente ya aceptó, así que el presupuesto quedó congelado con los precios de ese
                  día. Lo que se está ejecutando figura arriba, en el trabajo contratado.
                </>
              ) : (
                <>
                  Destildá lo que el cliente no quiera o cambiale el precio: los totales, el plazo y
                  las proyecciones se recalculan solos. Los ajustes son de esta propuesta y no tocan
                  tu lista de precios.
                </>
              )}
            </p>

            <div className="tiles" style={{ marginTop: 16, marginBottom: 0 }}>
              <div className="tile">
                <div className="tile-l">Pago único</div>
                <div className="tile-v">{formatearPesos(informe.propuesta.totalUnico)}</div>
              </div>
              <div className="tile">
                <div className="tile-l">Mensual</div>
                <div className="tile-v">{formatearPesos(informe.propuesta.totalMensual)}</div>
              </div>
              <div className="tile">
                <div className="tile-l">Plazo de entrega</div>
                <div className="tile-v">
                  {informe.propuesta.plazoDiasEstimado > 0
                    ? `${informe.propuesta.plazoDiasEstimado} días`
                    : 'Continuo'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <EnviarPropuesta
        auditoriaId={id}
        bloqueado={informe.provisional}
        onEnviada={() => void api.informe(id).then(setInforme)}
      />
      </section>

      <section className={seccion === 'seguimiento' ? undefined : 'seccion-oculta'}>
        <Seguimiento informe={informe} onCambio={setInforme} />
      </section>
    </>
  );
}

interface LineaProps {
  servicio: ServicioSugerido;
  guardando: boolean;
  /** El cliente ya aceptó: los precios quedaron pactados y no se editan más. */
  cerrada: boolean;
  onAjustar: (incluido: boolean, precio: number | null) => void;
}

/**
 * Una línea del presupuesto, editable.
 *
 * El precio se guarda al salir del campo o con Enter, no en cada tecla: cada
 * guardado recalcula el informe entero del lado del servidor, y hacerlo por
 * cada dígito tecleado sería una consulta por letra.
 */
function LineaDeServicio({ servicio, guardando, cerrada, onAjustar }: LineaProps) {
  const [precio, setPrecio] = useState(String(servicio.precio));

  useEffect(() => {
    setPrecio(String(servicio.precio));
  }, [servicio.precio]);

  const confirmarPrecio = () => {
    const valor = Number(precio.replace(/\./g, '').replace(',', '.'));

    if (!Number.isFinite(valor) || valor < 0) {
      setPrecio(String(servicio.precio));
      return;
    }
    if (valor === servicio.precio) return;

    onAjustar(servicio.incluido, valor);
  };

  return (
    <div
      className="servicio"
      style={{
        opacity: servicio.incluido ? 1 : 0.55,
        borderColor: servicio.incluido ? 'var(--accent)' : 'var(--border-soft)',
      }}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', minWidth: 0 }}>
        <input
          type="checkbox"
          className="solo-pantalla"
          checked={servicio.incluido}
          disabled={guardando || cerrada}
          onChange={(e) =>
            onAjustar(e.target.checked, servicio.precioAjustado ? servicio.precio : null)
          }
          aria-label={`Incluir ${servicio.nombre} en el presupuesto`}
          style={{ width: 17, height: 17, marginTop: 3, flex: 'none' }}
        />
        <div style={{ minWidth: 0 }}>
          <h3>{servicio.nombre}</h3>
          <p>
            Resuelve {servicio.hallazgosQueResuelve}{' '}
            {servicio.hallazgosQueResuelve === 1 ? 'hallazgo' : 'hallazgos'} · {servicio.descripcion}
          </p>
        </div>
      </div>

      <div className="precio">
        <span className="solo-impresion">{formatearPesos(servicio.precio)}</span>

        <span
          className="solo-pantalla"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <span style={{ color: 'var(--muted)' }}>$</span>
          <input
            type="text"
            inputMode="numeric"
            value={precio}
            disabled={guardando || cerrada || !servicio.incluido}
            onChange={(e) => setPrecio(e.target.value)}
            onBlur={confirmarPrecio}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label={`Precio de ${servicio.nombre}`}
            style={{ width: 108, textAlign: 'right', fontFamily: 'var(--mono)', padding: '5px 8px' }}
          />
        </span>

        <small>
          {servicio.modalidad === 'MENSUAL' ? 'por mes' : `único · ${servicio.plazoDias} días`}
          {servicio.precioAjustado && !cerrada && (
            <>
              {' · '}
              <button
                type="button"
                className="solo-pantalla"
                onClick={() => onAjustar(servicio.incluido, null)}
                disabled={guardando}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  font: 'inherit',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                }}
                title={`En lista sale ${formatearPesos(servicio.precioDeLista)}`}
              >
                volver a lista
              </button>
            </>
          )}
        </small>
      </div>
    </div>
  );
}
