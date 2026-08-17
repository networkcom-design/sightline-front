import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ErrorApi } from '../api/cliente';
import { Pasos } from '../componentes/Piezas';

export function NuevaAuditoria() {
  const navegar = useNavigate();

  const [datos, setDatos] = useState({
    nombre: '',
    rubro: '',
    ciudad: '',
    telefono: '',
    direccion: '',
    sitioWeb: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos({ ...datos, [campo]: e.target.value });

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const informe = await api.crear(datos);
      navegar(`/auditorias/${informe.id}/evidencia`);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo crear la auditoría.');
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Nueva auditoría</h1>
          <p className="sub">
            Los datos que no tengas, dejalos vacíos: la ausencia también es un hallazgo.
          </p>
        </div>
      </div>

      <Pasos actual={1} />

      {error && <div className="aviso error">{error}</div>}

      <form className="tarjeta" onSubmit={enviar}>
        <div className="grilla">
          <div className="campo">
            <label htmlFor="nombre">Nombre del comercio</label>
            <input id="nombre" value={datos.nombre} onChange={cambiar('nombre')} required autoFocus />
          </div>
          <div className="campo">
            <label htmlFor="rubro">Rubro</label>
            <input
              id="rubro"
              value={datos.rubro}
              onChange={cambiar('rubro')}
              required
              placeholder="Barbería, gimnasio, rotisería..."
            />
          </div>
          <div className="campo">
            <label htmlFor="ciudad">Ciudad</label>
            <input id="ciudad" value={datos.ciudad} onChange={cambiar('ciudad')} />
          </div>
          <div className="campo">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" value={datos.telefono} onChange={cambiar('telefono')} />
          </div>
          <div className="campo">
            <label htmlFor="direccion">Dirección</label>
            <input id="direccion" value={datos.direccion} onChange={cambiar('direccion')} />
          </div>
          <div className="campo">
            <label htmlFor="sitioWeb">Sitio web</label>
            <input
              id="sitioWeb"
              value={datos.sitioWeb}
              onChange={cambiar('sitioWeb')}
              placeholder="donramonbarber.com.ar"
            />
          </div>
        </div>

        <p className="ayuda" style={{ marginBottom: 16 }}>
          El teléfono y la dirección se usan después para detectar si coinciden con lo que dice
          cada perfil. Si cargás el sitio, se analiza solo en el momento.
        </p>

        <div className="acciones">
          <button className="boton" type="submit" disabled={enviando}>
            {enviando ? 'Analizando el sitio...' : 'Crear y analizar'}
          </button>
        </div>
      </form>
    </>
  );
}
