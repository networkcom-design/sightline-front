import { useState } from 'react';
import { ErrorApi } from '../api/cliente';
import { useSesion } from '../auth/Sesion';
import { Logo } from '../componentes/Piezas';

export function Ingreso() {
  const { ingresar, registrarse } = useSesion();

  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      if (esRegistro) {
        await registrarse(nombre, email, contrasena);
      } else {
        await ingresar(email, contrasena);
      }
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo completar la operación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="centrado">
      <form className="tarjeta" style={{ width: '100%', maxWidth: 380 }} onSubmit={enviar}>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginBottom: 18 }}>
          <Logo tamano={22} />
          <strong style={{ fontWeight: 500, fontSize: 18 }}>Lupa</strong>
        </div>

        <p className="sub" style={{ textAlign: 'center', marginBottom: 20 }}>
          Auditoría de presencia digital para comercios
        </p>

        {error && <div className="aviso error">{error}</div>}

        {esRegistro && (
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="campo">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="campo">
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            minLength={esRegistro ? 8 : undefined}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
          />
          {esRegistro && <p className="ayuda">Mínimo 8 caracteres.</p>}
        </div>

        <button className="boton" type="submit" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Un momento...' : esRegistro ? 'Crear cuenta' : 'Entrar'}
        </button>

        <p className="ayuda" style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            className="boton fantasma"
            style={{ border: 'none', padding: 0, color: 'var(--accent)' }}
            onClick={() => {
              setEsRegistro((valor) => !valor);
              setError(null);
            }}
          >
            {esRegistro ? 'Ya tengo cuenta' : 'Crear una cuenta'}
          </button>
        </p>
      </form>
    </div>
  );
}
