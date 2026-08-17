import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { api, borrarToken, guardarToken, leerToken } from '../api/cliente';
import type { Usuario } from '../api/tipos';

interface Contexto {
  usuario: Usuario | null;
  cargando: boolean;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  registrarse: (nombre: string, email: string, contrasena: string) => Promise<void>;
  salir: () => void;
}

const SesionContexto = createContext<Contexto | null>(null);

export function ProveedorDeSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  /**
   * Al arrancar, si hay un token guardado se le pregunta al backend si sigue
   * siendo válido. No alcanza con que exista: puede haber vencido mientras la
   * pestaña estaba cerrada, y mostrar la aplicación para que después falle cada
   * pedido es peor que mandar directo al ingreso.
   */
  useEffect(() => {
    if (!leerToken()) {
      setCargando(false);
      return;
    }

    api
      .yo()
      .then((datos) =>
        setUsuario({ ...datos, creadoEn: new Date().toISOString() }),
      )
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  const valor = useMemo<Contexto>(
    () => ({
      usuario,
      cargando,
      ingresar: async (email, contrasena) => {
        const respuesta = await api.login(email, contrasena);
        guardarToken(respuesta.token);
        setUsuario(respuesta.usuario);
      },
      registrarse: async (nombre, email, contrasena) => {
        const respuesta = await api.registro(nombre, email, contrasena);
        guardarToken(respuesta.token);
        setUsuario(respuesta.usuario);
      },
      salir: () => {
        borrarToken();
        setUsuario(null);
      },
    }),
    [usuario, cargando],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): Contexto {
  const contexto = useContext(SesionContexto);
  if (!contexto) {
    throw new Error('useSesion tiene que usarse dentro de ProveedorDeSesion.');
  }
  return contexto;
}
