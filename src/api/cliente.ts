import type {
  Informe,
  MensajeParaEnviar,
  RespuestaAutenticacion,
  Resumen,
  VistaPublica,
} from './tipos';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const CLAVE_TOKEN = 'lupa.token';

/**
 * Error de la API con el detalle que mandó el backend.
 *
 * El backend responde con ProblemDetail, así que el mensaje que llega ya está
 * escrito para una persona. Se usa ese y no uno genérico: "faltan responder 34
 * señales" le sirve al usuario, "Error 409" no.
 */
export class ErrorApi extends Error {
  // Los campos van declarados aparte y no como parámetros del constructor:
  // el proyecto usa `erasableSyntaxOnly`, que exige que el TypeScript se pueda
  // borrar sin transformar nada, y las propiedades de constructor generan código.
  readonly estado: number;
  readonly errores?: Record<string, string>;

  constructor(estado: number, mensaje: string, errores?: Record<string, string>) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores;
  }
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function leerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN);
}

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  conToken?: boolean;
}

async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, conToken = true } = opciones;

  const cabeceras: Record<string, string> = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

  if (conToken) {
    const token = leerToken();
    if (token) cabeceras.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    // Distinguir "no llegué al servidor" de "el servidor dijo que no" importa:
    // el primero se resuelve prendiendo el backend, el segundo no.
    throw new ErrorApi(0, 'No se pudo conectar con el servidor de Sightline.');
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    // El 401 sobre un token guardado significa que venció: se limpia para que
    // la aplicación no quede en un limbo de "logueado pero sin permisos".
    if (respuesta.status === 401 && conToken) borrarToken();

    throw new ErrorApi(
      respuesta.status,
      datos?.detail ?? datos?.title ?? 'Algo salió mal.',
      datos?.errores,
    );
  }

  return datos as T;
}

export const api = {
  registro: (nombre: string, email: string, contrasena: string) =>
    pedir<RespuestaAutenticacion>('/api/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre, email, contrasena },
      conToken: false,
    }),

  login: (email: string, contrasena: string) =>
    pedir<RespuestaAutenticacion>('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { email, contrasena },
      conToken: false,
    }),

  yo: () => pedir<{ id: string; nombre: string; email: string }>('/api/auth/yo'),

  listar: () => pedir<Resumen[]>('/api/auditorias'),

  crear: (datos: {
    nombre: string;
    rubro: string;
    ciudad?: string;
    telefono?: string;
    direccion?: string;
    sitioWeb?: string;
  }) => pedir<Informe>('/api/auditorias', { metodo: 'POST', cuerpo: datos }),

  informe: (id: string) => pedir<Informe>(`/api/auditorias/${id}`),

  analizarEvidencia: (
    id: string,
    datos: { textoInstagram?: string; textoFichaGoogle?: string; notas?: string },
  ) => pedir<Informe>(`/api/auditorias/${id}/evidencia`, { metodo: 'POST', cuerpo: datos }),

  corregir: (id: string, codigo: string, estado: string) =>
    pedir<Informe>(`/api/auditorias/${id}/senales/${codigo}`, {
      metodo: 'PUT',
      cuerpo: { estado },
    }),

  /** `precio` en null vuelve el servicio al precio de lista. */
  ajustarServicio: (id: string, codigo: string, incluido: boolean, precio: number | null) =>
    pedir<Informe>(`/api/auditorias/${id}/propuesta/servicios/${codigo}`, {
      metodo: 'PUT',
      cuerpo: { incluido, precio },
    }),

  /** Redacta el mensaje para el prospecto. No manda nada: solo devuelve el texto. */
  mensaje: (id: string, canal: 'WHATSAPP' | 'EMAIL', origen: string) =>
    pedir<MensajeParaEnviar>(
      `/api/auditorias/${id}/mensaje?canal=${canal}&origen=${encodeURIComponent(origen)}`,
    ),

  marcarEnviada: (id: string) =>
    pedir<Informe>(`/api/auditorias/${id}/enviada`, { metodo: 'POST' }),

  marcarRevisada: (id: string) =>
    pedir<Informe>(`/api/auditorias/${id}/revisada`, { metodo: 'POST' }),

  eliminar: (id: string) => pedir<void>(`/api/auditorias/${id}`, { metodo: 'DELETE' }),

  vistaPublica: (token: string) =>
    pedir<VistaPublica>(`/api/publico/informes/${token}`, { conToken: false }),
};
