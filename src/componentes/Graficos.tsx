import type { PuntajePorDimension } from '../api/tipos';

/**
 * Gráficos de Lupa, dibujados a mano en SVG.
 *
 * Sin librería de charts a propósito: son tres formas simples, el SVG imprime
 * nítido en el PDF —que es donde el comerciante lo va a mirar— y no suma 200 kB
 * al paquete para dibujar barras.
 *
 * Sobre el color: el puntaje es una magnitud ordenada, así que las barras usan
 * una rampa de un solo tono de claro a oscuro. Probé una escala rojo-amarillo-verde
 * y el validador la rechazó: naranja contra oliva da una diferencia de 3 sobre 100
 * para daltonismo protán, y los dos verdes que teníamos ni siquiera se distinguían
 * con visión normal. El rojo y el verde quedan reservados para el par de estado,
 * que está validado, y en todos los casos el número va escrito al lado: el color
 * nunca es el único canal.
 */

/**
 * El tono sale de una variable CSS y no de una constante en JavaScript.
 *
 * Así el gráfico cambia solo cuando cambia el tema del sistema, sin escuchar
 * `matchMedia` ni volver a renderizar. Los pasos oscuros están elegidos aparte,
 * no aclarados desde los claros.
 */
function tonoPorPuntaje(puntaje: number): string {
  if (puntaje < 40) return 'var(--rampa-1)';
  if (puntaje < 60) return 'var(--rampa-2)';
  if (puntaje < 80) return 'var(--rampa-3)';
  return 'var(--rampa-4)';
}

/**
 * Comparativa de puntaje: dónde está hoy, dónde queda al entregar y hasta dónde
 * llega sosteniéndolo.
 *
 * Es el gráfico que más pesa en una reunión de venta, así que va primero y solo.
 * Las tres barras comparten color porque son la misma medida en tres momentos:
 * pintarlas distinto sugeriría que son cosas diferentes.
 */
export function ComparativaDePuntaje({
  actual,
  alEntregar,
  sostenido,
}: {
  actual: number;
  alEntregar: number;
  sostenido: number;
}) {
  const barras = [
    { etiqueta: 'Hoy', valor: actual },
    { etiqueta: 'Al entregar', valor: alEntregar },
    { etiqueta: 'Sosteniéndolo', valor: sostenido },
  ];

  const ancho = 520;
  const alto = 190;
  const margenIzq = 96;
  const margenDer = 46;
  const anchoBarra = 34;
  const separacion = 52;
  const util = ancho - margenIzq - margenDer;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        width="100%"
        role="img"
        aria-label={`El comercio está hoy en ${actual} puntos, llega a ${alEntregar} al entregar el trabajo y a ${sostenido} sosteniéndolo.`}
        style={{ display: 'block', maxWidth: 560 }}
      >
        {[0, 25, 50, 75, 100].map((marca) => (
          <g key={marca}>
            <line
              x1={margenIzq + (util * marca) / 100}
              y1={14}
              x2={margenIzq + (util * marca) / 100}
              y2={alto - 26}
              stroke="var(--border-soft)"
              strokeWidth={1}
            />
            <text
              x={margenIzq + (util * marca) / 100}
              y={alto - 10}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--faint)"
              fontFamily="var(--mono)"
            >
              {marca}
            </text>
          </g>
        ))}

        {barras.map((barra, i) => {
          const y = 20 + i * separacion;
          const largo = Math.max(2, (util * barra.valor) / 100);
          return (
            <g key={barra.etiqueta}>
              <text
                x={margenIzq - 12}
                y={y + anchoBarra / 2 + 4}
                textAnchor="end"
                fontSize={12.5}
                fill="var(--text-dim, var(--muted))"
              >
                {barra.etiqueta}
              </text>
              <rect
                x={margenIzq}
                y={y}
                width={largo}
                height={anchoBarra}
                rx={4}
                fill={tonoPorPuntaje(barra.valor)}
              />
              <text
                x={margenIzq + largo + 8}
                y={y + anchoBarra / 2 + 5}
                fontSize={14}
                fontWeight={500}
                fill="var(--ink)"
                fontFamily="var(--mono)"
              >
                {barra.valor}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * Las siete dimensiones como barras horizontales, ordenadas de peor a mejor.
 *
 * El orden no es cosmético: pone arriba lo que hay que arreglar primero, que es
 * por donde arranca la conversación.
 */
export function GraficoDimensiones({
  dimensiones,
  ordenarPorPuntaje = true,
}: {
  dimensiones: PuntajePorDimension[];
  ordenarPorPuntaje?: boolean;
}) {
  const datos = ordenarPorPuntaje
    ? [...dimensiones].sort((a, b) => a.puntaje - b.puntaje)
    : dimensiones;

  const filas = datos.length;
  const ancho = 520;
  const altoFila = 30;
  const alto = filas * altoFila + 26;
  const margenIzq = 152;
  const margenDer = 40;
  const util = ancho - margenIzq - margenDer;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        width="100%"
        role="img"
        aria-label={`Puntaje por canal: ${datos
          .map((d) => `${d.dimension} ${d.puntaje}`)
          .join(', ')}.`}
        style={{ display: 'block' }}
      >
        {[0, 50, 100].map((marca) => (
          <line
            key={marca}
            x1={margenIzq + (util * marca) / 100}
            y1={4}
            x2={margenIzq + (util * marca) / 100}
            y2={filas * altoFila + 2}
            stroke="var(--border-soft)"
            strokeWidth={1}
          />
        ))}

        {datos.map((d, i) => {
          const y = i * altoFila + 6;
          const largo = Math.max(2, (util * d.puntaje) / 100);
          return (
            <g key={d.dimension}>
              <text
                x={margenIzq - 12}
                y={y + 14}
                textAnchor="end"
                fontSize={12}
                fill="var(--muted)"
              >
                {d.dimension}
              </text>
              <rect
                x={margenIzq}
                y={y}
                width={largo}
                height={18}
                rx={4}
                fill={tonoPorPuntaje(d.puntaje)}
              />
              <text
                x={margenIzq + largo + 7}
                y={y + 13}
                fontSize={12}
                fill="var(--ink)"
                fontFamily="var(--mono)"
              >
                {d.puntaje}
              </text>
            </g>
          );
        })}

        <text x={margenIzq} y={alto - 6} fontSize={10.5} fill="var(--faint)" fontFamily="var(--mono)">
          0
        </text>
        <text
          x={margenIzq + util}
          y={alto - 6}
          fontSize={10.5}
          fill="var(--faint)"
          fontFamily="var(--mono)"
          textAnchor="end"
        >
          100
        </text>
      </svg>
    </figure>
  );
}

/**
 * Cuánto trabajo hay por delante, partido por impacto.
 *
 * No es un gráfico sino tres números grandes: para tres valores, una torta o un
 * apilado se leen peor que el número escrito. Acá el color sí distingue estado,
 * y por eso usa el par validado más el neutro, siempre con la palabra al lado.
 */
export function HallazgosPorImpacto({
  alto: cantidadAlto,
  medio,
  bajo,
}: {
  alto: number;
  medio: number;
  bajo: number;
}) {
  const grupos = [
    { etiqueta: 'De alto impacto', valor: cantidadAlto, clase: 'critico' },
    { etiqueta: 'De impacto medio', valor: medio, clase: 'basico' },
    { etiqueta: 'De impacto bajo', valor: bajo, clase: 'neutro' },
  ];

  return (
    <div className="tiles" style={{ marginBottom: 0 }}>
      {grupos.map((g) => (
        <div className="tile" key={g.etiqueta}>
          <div className="tile-l">{g.etiqueta}</div>
          <div className="tile-v">
            <span className={`punto-impacto ${g.clase}`} aria-hidden="true" />
            {g.valor}
          </div>
        </div>
      ))}
    </div>
  );
}
