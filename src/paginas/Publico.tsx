import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { VistaPublica } from '../api/tipos';
import { ComparativaDePuntaje, GraficoDimensiones } from '../componentes/Graficos';
import { ChipNivel, Logo, Medidor } from '../componentes/Piezas';

/**
 * El informe que ve el prospecto.
 *
 * Cambia el registro tipográfico a propósito: adentro de Sightline es una
 * herramienta, acá es un documento. Y no muestra horas, precios por servicio ni
 * de dónde salió cada dictamen: esos campos no llegan siquiera desde la API.
 */
export function Publico() {
  const { token = '' } = useParams();
  const [vista, setVista] = useState<VistaPublica | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .vistaPublica(token)
      .then(setVista)
      .catch((e) =>
        setError(e instanceof ErrorApi ? e.message : 'No se pudo abrir este informe.'),
      );
  }, [token]);

  if (error) {
    return (
      <div className="centrado">
        <div className="tarjeta" style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 19 }}>No se pudo abrir el informe</h1>
          <p className="sub">{error}</p>
        </div>
      </div>
    );
  }

  if (!vista) return <p className="cargando">Cargando informe...</p>;

  const fecha = new Date(vista.fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="documento">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo tamano={15} />
          <span className="de">Diagnóstico preparado por {vista.auditadoPor}</span>
        </div>
        <button className="boton fantasma solo-pantalla" onClick={() => window.print()}>
          Descargar PDF
        </button>
      </div>

      <h1>{vista.nombre}</h1>
      <p className="meta">
        {vista.rubro}
        {vista.ciudad ? ` · ${vista.ciudad}` : ''} · {fecha}
      </p>

      <div className="puntaje-bloque" style={{ fontFamily: 'var(--sans)', marginBottom: 28 }}>
        <div className="puntaje-grande">
          <b>{vista.puntaje}</b>
          <ChipNivel nivel={vista.nivel} />
        </div>
        <Medidor puntaje={vista.puntaje} />
      </div>

      <p className="parrafo">{vista.lecturaDelNivel}</p>

      <div style={{ fontFamily: 'var(--sans)', margin: '30px 0' }}>
        <h2>Hasta dónde puede llegar</h2>
        <p className="sub" style={{ marginBottom: 14, maxWidth: '58ch' }}>
          El primer número es hoy. El segundo, cómo queda cuando terminamos el trabajo. El tercero,
          hasta dónde llega si después lo sostiene mes a mes.
        </p>
        <ComparativaDePuntaje
          actual={vista.puntaje}
          alEntregar={vista.puntajeAlEntregar}
          sostenido={vista.puntajeSostenido}
        />
      </div>

      <div style={{ fontFamily: 'var(--sans)', margin: '30px 0' }}>
        <h2>Cómo está cada canal</h2>
        <p className="sub" style={{ marginBottom: 14, maxWidth: '58ch' }}>
          De peor a mejor. Las barras más cortas son las que más clientes están costando.
        </p>
        <GraficoDimensiones dimensiones={vista.dimensiones} />
      </div>

      {vista.prioridades.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: 'var(--sans)' }}>Lo primero que hay que arreglar</h2>
          <ol>
            {vista.prioridades.map((p, i) => (
              <li key={i}>
                <strong>{p.titulo}.</strong> {p.queHacer}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="cierre-doc">
        <h2>Cómo lo resolvemos</h2>
        <p>
          {vista.plazoDiasEstimado > 0 ? (
            <>
              {vista.auditadoPor} puede dejar estos puntos resueltos en {vista.plazoDiasEstimado}{' '}
              días. Con eso, el diagnóstico pasa de {vista.puntaje} a {vista.puntajeAlEntregar}.
            </>
          ) : (
            <>
              {vista.auditadoPor} puede llevar el diagnóstico de {vista.puntaje} a{' '}
              {vista.puntajeSostenido} con trabajo sostenido mes a mes.
            </>
          )}
          {vista.puntajeSostenido > vista.puntajeAlEntregar && vista.plazoDiasEstimado > 0 && (
            <>
              {' '}
              Sosteniendo después la publicación y las reseñas, llega a {vista.puntajeSostenido}.
            </>
          )}
        </p>
      </div>

      <div className="pie-impresion solo-impresion">
        <span>
          {vista.nombre} · Diagnóstico de presencia digital · {vista.auditadoPor}
        </span>
        <span>{fecha}</span>
      </div>
    </div>
  );
}
