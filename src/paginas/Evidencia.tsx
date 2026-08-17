import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import type { Informe } from '../api/tipos';
import { Pasos } from '../componentes/Piezas';

export function Evidencia() {
  const { id = '' } = useParams();
  const navegar = useNavigate();

  const [informe, setInforme] = useState<Informe | null>(null);
  const [textoInstagram, setTextoInstagram] = useState('');
  const [textoFichaGoogle, setTextoFichaGoogle] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    api
      .informe(id)
      .then(setInforme)
      .catch((e) => setError(e instanceof ErrorApi ? e.message : 'No se pudo cargar la auditoría.'));
  }, [id]);

  const analizar = async () => {
    setError(null);
    setAnalizando(true);

    try {
      const resultado = await api.analizarEvidencia(id, { textoInstagram, textoFichaGoogle, notas });

      // Si el análisis quedó a medias hay que decirlo acá y no dejar que el
      // auditor lo descubra al ver la lista de pendientes más larga de lo
      // esperado: quedarse sin cuota y que la IA no encuentre nada se ven igual.
      if (resultado.avisoDelAnalisis) {
        setError(resultado.avisoDelAnalisis);
        setAnalizando(false);
        return;
      }

      navegar(`/auditorias/${id}/revision`);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo analizar la evidencia.');
      setAnalizando(false);
    }
  };

  const medicion = informe?.medicion;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>{informe?.nombre ?? 'Evidencia'}</h1>
          <p className="sub">Abrí el perfil, seleccioná todo y pegá. De interpretar se encarga la IA.</p>
        </div>
      </div>

      <Pasos actual={2} />

      {error && (
        <div className="aviso atencion">
          {error}
          <div style={{ marginTop: 10 }}>
            <button className="boton fantasma" onClick={() => navegar(`/auditorias/${id}/revision`)}>
              Seguir y responder a mano
            </button>
          </div>
        </div>
      )}

      {medicion && (
        <div className="tarjeta">
          <h2>Sitio medido automáticamente</h2>
          {medicion.alcanzable ? (
            <div className="tiles" style={{ marginBottom: 0 }}>
              <div className="tile">
                <div className="tile-l">Tiempo de carga</div>
                <div className="tile-v">{(medicion.milisegundos / 1000).toFixed(2)} s</div>
              </div>
              <div className="tile">
                <div className="tile-l">Certificado seguro</div>
                <div className="tile-v">{medicion.esHttps ? 'Sí' : 'No'}</div>
              </div>
              <div className="tile">
                <div className="tile-l">Adaptado a celular</div>
                <div className="tile-v">{medicion.tieneViewport ? 'Sí' : 'No'}</div>
              </div>
              <div className="tile">
                <div className="tile-l">Título</div>
                <div className="tile-v">{medicion.titulo?.length ?? 0}</div>
              </div>
              <div className="tile">
                <div className="tile-l">Contacto visible</div>
                <div className="tile-v">{medicion.tieneContactoVisible ? 'Sí' : 'No'}</div>
              </div>
            </div>
          ) : (
            <p className="sub">{medicion.error ?? 'No se pudo analizar el sitio.'}</p>
          )}
        </div>
      )}

      <div className="tarjeta">
        <div className="campo">
          <label htmlFor="ig">
            Perfil de Instagram <span className="chip ia">resuelve hasta 12 señales</span>
          </label>
          <textarea
            id="ig"
            value={textoInstagram}
            onChange={(e) => setTextoInstagram(e.target.value)}
            placeholder="Abrí el perfil, seleccioná todo con Ctrl+A y pegá acá."
          />
          <p className="ayuda">{textoInstagram.length} caracteres</p>
        </div>

        <div className="campo">
          <label htmlFor="google">
            Ficha de Google <span className="chip ia">resuelve hasta 11 señales</span>
          </label>
          <textarea
            id="google"
            value={textoFichaGoogle}
            onChange={(e) => setTextoFichaGoogle(e.target.value)}
            placeholder="Nombre, estrellas, cantidad de reseñas, horarios, fotos, teléfono..."
          />
          <p className="ayuda">{textoFichaGoogle.length} caracteres</p>
        </div>

        <div className="campo">
          <label htmlFor="notas">Notas tuyas</label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            style={{ minHeight: 70 }}
            placeholder="Lo que hayas visto y no entre en las categorías de arriba."
          />
        </div>

        <div className="acciones">
          <button className="boton" onClick={analizar} disabled={analizando}>
            {analizando ? 'Analizando con IA...' : 'Analizar con IA'}
          </button>
          <button
            className="boton fantasma"
            onClick={() => navegar(`/auditorias/${id}/revision`)}
            disabled={analizando}
          >
            Saltear y responder a mano
          </button>
        </div>

        <p className="ayuda" style={{ marginTop: 12 }}>
          {analizando
            ? 'Puede tardar hasta medio minuto. No cierres la pestaña.'
            : 'Si la IA falla, las señales quedan para el cuestionario y no se pierde nada.'}
        </p>
      </div>
    </>
  );
}
