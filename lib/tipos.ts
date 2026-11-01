export type Local = {
  id: string; slug: string; nombre: string; descripcion: string; direccion: string;
  horarios: string; instagram: string; carta_url: string; whatsapp: string; fotos: string[];
  pin_mozo: string; clave_panel: string;
};
export type Beneficio = {
  id: string; local_id: string; titulo: string; descripcion: string;
  tipo: "porcentaje" | "2x1" | "regalo" | "otro";
  dias: number[]; hora_desde: number; hora_hasta: number;
  es_bienvenida: boolean; activo: boolean;
};
export type Miembro = {
  id: string; local_id: string; nombre: string; telefono: string;
  acepta_whatsapp: boolean; baja_at: string | null; created_at: string;
};
export type Cupon = {
  id: string; local_id: string; beneficio_id: string; miembro_id: string;
  codigo: string; vence_at: string; canjeado_at: string | null;
};
