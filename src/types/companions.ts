export interface Acompanante {
  id_acompanante: number;
  id_paciente: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  relacion_con_paciente: string | null;
}
