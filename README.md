# yapa · MVP

Club de clientes para locales gastronómicos. Sin app: el cliente escanea un QR en la mesa.

## Qué hace

| Quién | Dónde | Qué |
|---|---|---|
| Comensal | `/<local>` | Ve **Beneficios** y **Conocé el local**; se suma con nombre + WhatsApp + consentimiento; pide un código de 4 dígitos para usar un beneficio |
| Mozo | `/<local>/mozo` | Entra con PIN, tipea el código, ve ✓ o ✗ con el motivo |
| Dueño | `/<local>/panel` | Crea, edita y pausa beneficios (días y franja horaria); ve miembros y exporta CSV; informe del mes; edita datos del local; descarga el QR |
| yapa | `/admin` | Crea locales y obtiene el link mágico del panel y el PIN del mozo |

### Reglas
- Beneficios solo para miembros. Un beneficio de **bienvenida** se usa una vez y su código dura 30 días.
- El resto vale solo en sus días y horarios (hora argentina), un uso por día por miembro, y el código dura 2 horas.
- El código de bienvenida se puede mandar al WhatsApp del local con un toque (link `wa.me`, sin costo de API).
- Consentimiento de datos y consentimiento de WhatsApp son casillas separadas; se guarda el texto aceptado y la fecha. Baja en `/<local>/baja`.

## Correr local

```bash
npm install
cp .env.example .env.local   # poné ADMIN_KEY
npm run dev
```
Abrí `http://localhost:3000/admin`, creá un local con "datos de ejemplo" y usá el link del panel.

Sin `DATABASE_URL` usa Postgres embebido (PGlite) en `.data/`. Con `DATABASE_URL` usa Postgres real (Supabase/Neon); el esquema se crea solo al arrancar (`lib/schema.ts`).

## Deploy (Vercel + Supabase)
1. Crear proyecto en Supabase y copiar la connection string (pooler) a `DATABASE_URL`.
2. Importar el repo en Vercel con `DATABASE_URL`, `ADMIN_KEY` y `NEXT_PUBLIC_BASE_URL`.

## Estructura
- `lib/db.ts` conexión (pg o PGlite) · `lib/schema.ts` tablas · `lib/datos.ts` reglas de cupones y canje · `lib/informe.ts` métricas del mes
- `app/[slug]` página pública · `app/[slug]/mozo` canje · `app/[slug]/panel` panel del dueño · `app/admin`
- Colores y tipografías: variables en `app/globals.css` (cambiar ahí cuando se elija la paleta final).

## Pendiente / conocido
- Teléfonos: se asume celular argentino (se agrega 549). No valida el "15" viejo.
- Recuperar cuenta con el mismo WhatsApp no verifica el número (sin OTP). Para piloto alcanza.
- Fotos por URL, no hay subida de archivos.
- Informe: se ve en el panel y trae un texto listo para mandar; falta el envío automático mensual.
- Sin puntos/sellos, reservas ni campañas masivas (v2).
