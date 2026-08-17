import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ErrorApi } from '../api/cliente';
import type { MensajeParaEnviar } from '../api/tipos';

interface Props {
  auditoriaId: string;
  bloqueado: boolean;
  onEnviada: () => void;
}

/**
 * Arma el mensaje y abre WhatsApp o el correo con todo cargado.
 *
 * Lupa no manda nada por su cuenta a propósito. Mandar mensajes en nombre de
 * alguien exige la API de WhatsApp Business, aprobación de Meta y plantillas
 * preaprobadas, o un servidor de correo con dominio verificado. Nada de eso
 * hace falta para el problema real: el auditor abre la conversación con el
 * texto ya escrito, lo relee y aprieta enviar él.
 */
export function EnviarPropuesta({ auditoriaId, bloqueado, onEnviada }: Props) {
  const [canal, setCanal] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [mensaje, setMensaje] = useState<MensajeParaEnviar | null>(null);
  const [cuerpo, setCuerpo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const redactar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await api.mensaje(auditoriaId, canal, window.location.origin);
      setMensaje(respuesta);
      setCuerpo(respuesta.cuerpo);
      setAsunto(respuesta.asunto ?? '');
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo redactar el mensaje.');
    } finally {
      setCargando(false);
    }
  }, [auditoriaId, canal]);

  /**
   * Se redacta cuando lo pedís, no al abrir el informe.
   *
   * Antes se disparaba solo al montar el componente: cada vez que mirabas un
   * informe se iba una consulta a Gemini y te comías la espera, aunque no
   * tuvieras ninguna intención de mandar nada.
   *
   * Cambiar de canal sí vuelve a redactar, pero solo si ya habías redactado una
   * vez: en ese caso el cambio es una decisión tuya, no un efecto colateral de
   * haber entrado a la pantalla.
   */
  const yaRedacto = useRef(false);

  useEffect(() => {
    if (yaRedacto.current) void redactar();
  }, [canal, redactar]);

  const redactarPorPrimeraVez = () => {
    yaRedacto.current = true;
    void redactar();
  };

  if (bloqueado) {
    return (
      <div className="tarjeta">
        <h2>Enviar al cliente</h2>
        <p className="sub">
          Terminá de responder las señales que faltan y acá vas a poder mandar el diagnóstico por
          WhatsApp o por correo.
        </p>
      </div>
    );
  }

  // El cuerpo se arma en el navegador y no se reusa el enlace del backend,
  // porque el auditor pudo editar el texto antes de mandarlo.
  const enlaceWhatsApp = mensaje?.telefonoNormalizado
    ? `https://wa.me/${mensaje.telefonoNormalizado}?text=${encodeURIComponent(cuerpo)}`
    : null;

  const enlaceCorreo = `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  const abrir = (destino: string) => {
    window.open(destino, '_blank', 'noopener');
    void api.marcarEnviada(auditoriaId).then(onEnviada).catch(() => undefined);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(cuerpo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="tarjeta">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Enviar al cliente</h2>
        <div className="tri">
          <button
            className={canal === 'WHATSAPP' ? 'on si' : ''}
            onClick={() => setCanal('WHATSAPP')}
          >
            WhatsApp
          </button>
          <button className={canal === 'EMAIL' ? 'on si' : ''} onClick={() => setCanal('EMAIL')}>
            Correo
          </button>
        </div>
      </div>

      {error && <div className="aviso error">{error}</div>}

      {!mensaje && !cargando && (
        <>
          <p className="sub" style={{ marginBottom: 14, maxWidth: '60ch' }}>
            La IA arma el mensaje con los hallazgos de este comercio y le suma el enlace al
            diagnóstico. Después lo editás si querés, y lo mandás vos desde{' '}
            {canal === 'WHATSAPP' ? 'WhatsApp' : 'tu correo'}.
          </p>
          <button className="boton" onClick={redactarPorPrimeraVez}>
            Redactar mensaje
          </button>
        </>
      )}

      {cargando && <p className="cargando">Redactando el mensaje...</p>}

      {mensaje && !cargando && (
        <>
          {canal === 'WHATSAPP' ? (
            <div className="campo">
              <label>Teléfono del comercio</label>
              {mensaje.telefonoValido ? (
                <p className="ayuda" style={{ margin: 0 }}>
                  Se va a abrir el chat con <strong>{mensaje.telefonoParaMostrar}</strong>.
                </p>
              ) : (
                <div className="aviso atencion" style={{ marginBottom: 0 }}>
                  El teléfono cargado no se pudo interpretar, así que no puedo abrir el chat.
                  Corregilo en los datos del comercio, o copiá el mensaje y pegalo a mano.
                </div>
              )}
            </div>
          ) : (
            <div className="campo">
              <label htmlFor="correo">Correo del comercio</label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="contacto@comercio.com.ar"
              />
            </div>
          )}

          {canal === 'EMAIL' && (
            <div className="campo">
              <label htmlFor="asunto">Asunto</label>
              <input id="asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
            </div>
          )}

          <div className="campo">
            <label htmlFor="cuerpo">
              Mensaje{' '}
              {mensaje.redactadoPorIa ? (
                <span className="chip ia">redactado por IA</span>
              ) : (
                <span className="chip neutro">plantilla</span>
              )}
            </label>
            <textarea
              id="cuerpo"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              style={{ minHeight: canal === 'EMAIL' ? 190 : 150 }}
            />
            <p className="ayuda">
              Releelo antes de mandar. El enlace al diagnóstico ya está incluido al final.
            </p>
          </div>

          <div className="acciones">
            {canal === 'WHATSAPP' ? (
              <button
                className="boton"
                disabled={!enlaceWhatsApp}
                onClick={() => enlaceWhatsApp && abrir(enlaceWhatsApp)}
              >
                Abrir WhatsApp
              </button>
            ) : (
              <button className="boton" disabled={!correo} onClick={() => abrir(enlaceCorreo)}>
                Abrir el correo
              </button>
            )}

            <button className="boton fantasma" onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar mensaje'}
            </button>

            <button className="boton fantasma" onClick={redactar}>
              Redactar otro
            </button>
          </div>
        </>
      )}
    </div>
  );
}
