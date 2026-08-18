import type { Nivel, PuntajePorDimension } from '../api/tipos';

/**
 * Una mira: el círculo y las dos líneas que lo cruzan.
 *
 * Tres trazos y nada más, porque se usa a 15 y a 20 píxeles y a ese tamaño
 * cualquier detalle se convierte en una mancha. Además de aludir al nombre,
 * dice lo que hace la herramienta: apuntar a algo y medirlo.
 */
export function Logo({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.6" stroke="var(--accent)" strokeWidth="1.8" />
      <path d="M11 1.4 V5.2" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 16.8 V20.6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M1.4 11 H5.2" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.8 11 H20.6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11" cy="11" r="1.7" fill="var(--accent)" />
    </svg>
  );
}

const CLASE_POR_NIVEL: Record<Nivel, string> = {
  'Crítico': 'critico',
  'Básico': 'basico',
  'Competitivo': 'competitivo',
  'Referente': 'referente',
};

export function ChipNivel({ nivel }: { nivel: Nivel }) {
  return <span className={`chip ${CLASE_POR_NIVEL[nivel]}`}>{nivel}</span>;
}

/**
 * El medidor de las cuatro bandas.
 *
 * Muestra la escala completa y no solo el número: un 43 suelto no dice nada,
 * pero un 43 con la aguja parada al principio de la banda "Básico" se entiende
 * de un vistazo, que es lo que hace falta en una reunión.
 */
export function Medidor({ puntaje }: { puntaje: number }) {
  return (
    <div className="medidor">
      <div className="bandas">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
      </div>
      <div className="aguja">
        <span style={{ left: `${Math.min(98, Math.max(2, puntaje))}%` }}>{puntaje}</span>
      </div>
      <div className="escala">
        <span>Crítico</span>
        <span>Básico</span>
        <span>Competitivo</span>
        <span>Referente</span>
      </div>
    </div>
  );
}

function colorDePuntaje(puntaje: number): string {
  if (puntaje < 40) return 'var(--critico)';
  if (puntaje < 60) return 'var(--basico)';
  if (puntaje < 80) return 'var(--competitivo)';
  return 'var(--referente)';
}

export function Dimensiones({ dimensiones }: { dimensiones: PuntajePorDimension[] }) {
  return (
    <div className="dims">
      {dimensiones.map((d) => (
        <div className="dim" key={d.dimension}>
          <div className="dim-n">
            {d.dimension}
            <small>peso {d.peso}</small>
          </div>
          <div className="pista">
            <div
              className="lleno"
              style={{
                width: `${Math.max(2, d.puntaje)}%`,
                background: colorDePuntaje(d.puntaje),
              }}
            />
          </div>
          <div className="dim-v">{d.puntaje}</div>
        </div>
      ))}
    </div>
  );
}

export function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(valor);
}

export function formatearMinutos(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export function Pasos({ actual }: { actual: 1 | 2 | 3 | 4 }) {
  const nombres = ['Datos del comercio', 'Evidencia', 'Revisión', 'Informe'];
  return (
    <div className="pasos">
      {nombres.map((nombre, i) => {
        const numero = i + 1;
        const clase = numero === actual ? 'actual' : numero < actual ? 'hecho' : '';
        return (
          <span className={`paso ${clase}`} key={nombre}>
            {numero}. {nombre}
          </span>
        );
      })}
    </div>
  );
}
