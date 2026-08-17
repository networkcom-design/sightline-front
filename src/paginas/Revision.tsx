import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { EstadoSenal, Informe, SenalRespondida } from '../api/tipos';
import { Pasos } from '../componentes/Piezas';

const ESTADOS: { valor: EstadoSenal; codigo: string; etiqueta: string; clase: string }[] = [
  { valor: 'Cumple', codigo: 'CUMPLE', etiqueta: 'Cumple', clase: 'si' },
  { valor: 'No cumple', codigo: 'NO_CUMPLE', etiqueta: 'No cumple', clase: 'no' },
  { valor: 'No aplica', codigo: 'NO_APLICA', etiqueta: 'No aplica', clase: 'na' },
];

export function Revision() {
  const { id = '' } = useParams();
  const navegar = useNavigate();

  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    api
      .informe(id)
      .then(setInforme)
      .catch((e) => setError(e instanceof ErrorApi ? e.message : 'No se pudo cargar la auditoría.'));
  }, [id]);

  const responder = async (codigo: string, estadoCodigo: string) => {
    setGuardando(codigo);
    setError(null);
    try {
      setInforme(await api.corregir(id, codigo, estadoCodigo));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo guardar la respuesta.');
    } finally {
      setGuardando(null);
    }
  };

  const grupos = useMemo(() => {
    if (!informe) return null;

    const paraRevisar = informe.senales.filter((s) => s.necesitaRevision);
    const pendientes = informe.senales.filter((s) => s.origen === 'Pendiente');

    const porDimension = new Map<string, SenalRespondida[]>();
    for (const senal of informe.senales) {
      if (senal.necesitaRevision || senal.origen === 'Pendiente') continue;
      const lista = porDimension.get(senal.dimension) ?? [];
      lista.push(senal);
      porDimension.set(senal.dimension, lista);
    }

    return { paraRevisar, pendientes, porDimension };
  }, [informe]);

  if (error && !informe) return <div className="aviso error">{error}</div>;
  if (!informe || !grupos) return <p className="cargando">Cargando señales...</p>;

  const medidas = informe.senales.filter((s) => s.origen === 'Medido').length;
  const porIa = informe.senales.filter((s) => s.origen === 'Analizado por IA').length;
  const porVos = informe.senales.filter((s) => s.origen === 'Respondido por vos').length;
  const total = informe.senales.length;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>{informe.nombre}</h1>
          <p className="sub">
            {total - informe.senalesPendientes} de {total} señales resueltas
          </p>
        </div>
        <button
          className="boton"
          onClick={() => navegar(`/auditorias/${id}`)}
          disabled={informe.senalesPendientes > 0}
          title={
            informe.senalesPendientes > 0
              ? `Faltan responder ${informe.senalesPendientes} señales`
              : 'Ver el informe'
          }
        >
          Ver informe
        </button>
      </div>

      <Pasos actual={3} />

      {error && <div className="aviso error">{error}</div>}

      <div className="tarjeta">
        <div className="barra-triple">
          <i style={{ width: `${(medidas / total) * 100}%`, background: 'var(--accent)' }} />
          <i style={{ width: `${(porIa / total) * 100}%`, background: 'var(--violeta)' }} />
          <i style={{ width: `${(porVos / total) * 100}%`, background: 'var(--competitivo)' }} />
          <i
            style={{
              width: `${(informe.senalesPendientes / total) * 100}%`,
              background: 'var(--surface-2)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="chip medido">{medidas} medidas</span>
          <span className="chip ia">{porIa} por IA</span>
          {porVos > 0 && <span className="chip competitivo">{porVos} tuyas</span>}
          <span className="chip neutro">{informe.senalesPendientes} pendientes</span>
        </div>
      </div>

      {grupos.paraRevisar.length > 0 && (
        <BloqueSenales
          titulo="Revisá esto antes de seguir"
          detalle={`${grupos.paraRevisar.length} dictámenes con poca evidencia`}
          senales={grupos.paraRevisar}
          urgente
          guardando={guardando}
          onResponder={responder}
        />
      )}

      {grupos.pendientes.length > 0 && (
        <BloqueSenales
          titulo="Esto solo lo podés saber vos"
          detalle={`${grupos.pendientes.length} señales · nadie las ve desde afuera`}
          senales={grupos.pendientes}
          guardando={guardando}
          onResponder={responder}
        />
      )}

      {[...grupos.porDimension.entries()].map(([dimension, senales]) => (
        <BloqueSenales
          key={dimension}
          titulo={dimension}
          detalle={`${senales.length} señales`}
          senales={senales}
          guardando={guardando}
          onResponder={responder}
        />
      ))}
    </>
  );
}

interface BloqueProps {
  titulo: string;
  detalle: string;
  senales: SenalRespondida[];
  urgente?: boolean;
  guardando: string | null;
  onResponder: (codigo: string, estado: string) => void;
}

function BloqueSenales({ titulo, detalle, senales, urgente, guardando, onResponder }: BloqueProps) {
  return (
    <div className={`grupo${urgente ? ' urgente' : ''}`}>
      <div className="grupo-cabeza">
        {titulo}
        <span>{detalle}</span>
      </div>

      {senales.map((senal) => (
        <div className="fila-senal" key={senal.codigo}>
          <div className="fila-texto">
            <div className="fila-pregunta">{senal.pregunta}</div>
            {(senal.fundamento || senal.origen !== 'Pendiente') && (
              <div className="fila-fundamento">
                <span className={`chip ${senal.origen === 'Medido' ? 'medido' : 'ia'}`}>
                  {senal.origen}
                  {senal.origen === 'Analizado por IA' && senal.confianza
                    ? ` · confianza ${senal.confianza.toLowerCase()}`
                    : ''}
                </span>
                {senal.fundamento && <q>{senal.fundamento}</q>}
              </div>
            )}
          </div>

          <div style={{ flex: 'none' }}>
            {senal.editable ? (
              <div className="tri">
                {ESTADOS.map((opcion) => (
                  <button
                    key={opcion.codigo}
                    className={`${opcion.clase}${senal.estado === opcion.valor ? ' on' : ''}`}
                    disabled={guardando === senal.codigo}
                    onClick={() => onResponder(senal.codigo, opcion.codigo)}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`chip ${senal.estado === 'Cumple' ? 'competitivo' : 'critico'}`}>
                {senal.estado}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
