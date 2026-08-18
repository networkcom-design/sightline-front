/**
 * Los tipos que devuelve la API de Sightline.
 *
 * Están escritos a mano y espejan los records del backend. Si alguna vez el
 * contrato crece mucho, conviene generarlos desde OpenAPI; para siete endpoints,
 * mantenerlos a mano es más simple que sumar una herramienta.
 */

export type EstadoSenal = 'Cumple' | 'No cumple' | 'No aplica';

export type OrigenDeRespuesta =
  | 'Medido'
  | 'Analizado por IA'
  | 'Respondido por vos'
  | 'Pendiente';

export type Confianza = 'ALTA' | 'MEDIA' | 'BAJA';

export type Nivel = 'Crítico' | 'Básico' | 'Competitivo' | 'Referente';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  creadoEn: string;
}

export interface RespuestaAutenticacion {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: Usuario;
}

export interface MedicionSitio {
  urlFinal: string | null;
  alcanzable: boolean;
  codigoHttp: number;
  milisegundos: number;
  pesoKb: number;
  titulo: string | null;
  metaDescripcion: string | null;
  cantidadH1: number;
  tieneViewport: boolean;
  esHttps: boolean;
  tieneContactoVisible: boolean;
  error: string | null;
}

export interface SenalRespondida {
  codigo: string;
  dimension: string;
  pregunta: string;
  estado: EstadoSenal | null;
  origen: OrigenDeRespuesta;
  confianza: Confianza | null;
  fundamento: string | null;
  necesitaRevision: boolean;
  editable: boolean;
}

export interface PuntajePorDimension {
  dimension: string;
  descripcion: string;
  peso: number;
  puntaje: number;
  senalesCumplidas: number;
  senalesEvaluadas: number;
}

export interface Hallazgo {
  codigo: string;
  dimension: string;
  titulo: string;
  accion: string;
  impacto: string;
  esfuerzo: string;
  minutosEstimados: number;
}

export interface ServicioSugerido {
  codigo: string;
  nombre: string;
  descripcion: string;
  hallazgosQueResuelve: number;
  /** El precio que se cobra en esta propuesta: el ajustado si lo hay. */
  precio: number;
  precioDeLista: number;
  precioAjustado: boolean;
  incluido: boolean;
  modalidad: 'UNICO' | 'MENSUAL';
  plazoDias: number;
}

export interface Propuesta {
  servicios: ServicioSugerido[];
  totalUnico: number;
  totalMensual: number;
  /** Solo cuenta los servicios de pago único: un abono no tiene fecha de entrega. */
  plazoDiasEstimado: number;
  puntajeActual: number;
  /** Lo que se alcanza con el trabajo que se entrega y termina. */
  puntajeAlEntregar: number;
  /** Lo que se sostiene mientras siga el abono mensual. */
  puntajeSostenido: number;
  mejoraAlEntregar: number;
  aporteDelAbono: number;
}

export interface Informe {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string | null;
  telefono: string | null;
  direccion: string | null;
  sitioWeb: string | null;
  estado: string;
  tokenPublico: string;
  creadaEn: string;
  medicion: MedicionSitio | null;
  puntaje: number;
  nivel: Nivel;
  lecturaDelNivel: string;
  dimensiones: PuntajePorDimension[];
  planDeAccion: Hallazgo[];
  minutosTotalesEstimados: number;
  senales: SenalRespondida[];
  senalesParaRevisar: number;
  senalesPendientes: number;
  cobertura: number;
  provisional: boolean;
  propuesta: Propuesta;
  /** Por qué el análisis con IA no completó todo. Nulo si salió bien. */
  avisoDelAnalisis: string | null;
}

export interface Resumen {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string | null;
  puntaje: number;
  nivel: Nivel;
  estado: string;
  senalesRespondidas: number;
  senalesTotales: number;
  creadaEn: string;
}

export interface MensajeParaEnviar {
  canal: string;
  asunto: string | null;
  cuerpo: string;
  enlacePublico: string;
  telefonoNormalizado: string | null;
  telefonoParaMostrar: string | null;
  telefonoValido: boolean;
  enlaceWhatsApp: string | null;
  redactadoPorIa: boolean;
}

export interface PrioridadPublica {
  titulo: string;
  queHacer: string;
  impacto: string;
}

export interface VistaPublica {
  nombre: string;
  rubro: string;
  ciudad: string | null;
  fecha: string;
  puntaje: number;
  nivel: Nivel;
  lecturaDelNivel: string;
  dimensiones: PuntajePorDimension[];
  prioridades: PrioridadPublica[];
  puntajeAlEntregar: number;
  puntajeSostenido: number;
  plazoDiasEstimado: number;
  auditadoPor: string;
}
