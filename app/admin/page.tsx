import { q } from "@/lib/db";
import { baseUrl } from "@/lib/util";
import { crearLocal, esAdmin, loginAdmin } from "./acciones";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Admin({ searchParams }: Props) {
  const sp = await searchParams;
  if (!process.env.ADMIN_KEY) return <main className="contenedor"><p>Configurá ADMIN_KEY para usar el admin.</p></main>;
  if (!(await esAdmin())) {
    return (
      <main className="contenedor">
        <h1>Admin yapa</h1>
        <form action={loginAdmin}>
          <label htmlFor="clave">Clave</label>
          <input id="clave" name="clave" type="password" required autoFocus />
          <button className="btn bloque" style={{ marginTop: 12 }}>Entrar</button>
        </form>
      </main>
    );
  }
  const locales = await q<{ slug: string; nombre: string; pin_mozo: string; clave_panel: string; miembros: number }>(
    `SELECT l.slug, l.nombre, l.pin_mozo, l.clave_panel, count(m.id)::int AS miembros
       FROM locales l LEFT JOIN miembros m ON m.local_id = l.id AND m.baja_at IS NULL
      GROUP BY l.id ORDER BY l.created_at DESC`,
  );
  return (
    <main className="contenedor ancho">
      <h1>Locales</h1>
      {sp.error === "slug" && <div className="aviso error">Ya existe un local con esa dirección.</div>}
      {sp.creado && <div className="aviso ok">Local creado. Pasale al dueño su link del panel.</div>}
      <form action={crearLocal} className="tarjeta">
        <div className="fila">
          <div style={{ flex: 2 }}><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" type="text" required /></div>
          <div style={{ flex: 1 }}><label htmlFor="slug">Dirección (opcional)</label><input id="slug" name="slug" type="text" placeholder="cafe-luna" /></div>
        </div>
        <label className="check"><input type="checkbox" name="demo" /> Cargar datos y beneficios de ejemplo</label>
        <button className="btn" style={{ marginTop: 8 }}>Crear local</button>
      </form>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Local</th><th>Miembros</th><th>PIN mozo</th><th>Link del dueño</th></tr></thead>
          <tbody>
            {locales.map((l) => {
              const link = `${baseUrl()}/${l.slug}/panel/entrar?k=${l.clave_panel}`;
              return (
                <tr key={l.slug}>
                  <td><a href={`/${l.slug}`}>{l.nombre}</a></td><td>{l.miembros}</td><td>{l.pin_mozo}</td>
                  <td><a href={link}>Entrar al panel</a><div className="suave" style={{ wordBreak: "break-all" }}>{link}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
