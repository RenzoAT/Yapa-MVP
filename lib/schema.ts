// Se aplica al arrancar (idempotente).
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS locales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nombre text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  horarios text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  carta_url text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  fotos text[] NOT NULL DEFAULT '{}',
  pin_mozo text NOT NULL,
  clave_panel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un beneficio = promo o descuento. Restringible por días (0=dom..6=sáb) y franja horaria en minutos.
CREATE TABLE IF NOT EXISTS beneficios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id uuid NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'otro' CHECK (tipo IN ('porcentaje','2x1','regalo','otro')),
  dias int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  hora_desde int NOT NULL DEFAULT 0,
  hora_hasta int NOT NULL DEFAULT 1440,
  es_bienvenida boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id uuid NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text NOT NULL,
  acepta_whatsapp boolean NOT NULL DEFAULT false,
  consentimiento_texto text NOT NULL,
  consentimiento_at timestamptz NOT NULL DEFAULT now(),
  baja_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (local_id, telefono)
);

-- Un cupón es un código de 4 dígitos que el miembro le muestra al mozo.
CREATE TABLE IF NOT EXISTS cupones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id uuid NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  beneficio_id uuid NOT NULL REFERENCES beneficios(id) ON DELETE CASCADE,
  miembro_id uuid NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  vence_at timestamptz NOT NULL,
  canjeado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cupones_local_codigo ON cupones (local_id, codigo) WHERE canjeado_at IS NULL;
`;
