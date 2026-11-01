import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { q } from "@/lib/db";
import { getBeneficios, getLocal } from "@/lib/datos";
import { esDueno } from "@/lib/auth";
import { informeMes, mesActualAR } from "@/lib/informe";
import { DIAS, describirCuando, fechaAR, hhmm, vigenteAhora } from "@/lib/tiempo";
import { baseUrl } from "@/lib/util";
import type { Beneficio, Local } from "@/lib/tipos";
import { Marca } from "../../Marca";
import { alternarBeneficio, guardarBeneficio, guardarLocal, loginDueno } from "./acciones";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };
const TABS = [["beneficios", "Beneficios"], ["miembros", "Miembros"], ["informe", "Informe"], ["local", "Local y QR"]] as const;

export default async function Panel({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const local = await getLocal(slug);
  if (!local) notFound();

  if (!(await esDueno(local))) {
    return (
      <main className="contenedor">
        <h1>Panel de {local.nombre}</h1>
        {sp.error && <div className="aviso error">Clave incorrecta.</div>}
        <form action={loginDueno.bind(null, slug)}>
          <label htmlFor="clave">Clave del panel</label>
          <input id="clave" name="clave" type="password" required autoFocus />
          <button className="btn bloque" style={{ marginTop: 12 }}>Entrar</button>
        </form>
      </main>
    );
  }

  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "beneficios";
  return (
    <>
      <header className="cabecera">
        <div className="contenedor ancho fila entre">
          <h1 style={{ margin: 0 }}>{local.nombre}</h1>
          <span><Marca /> · <a href={`/${slug}`}>ver página</a> · <a href={`/${slug}/mozo`}>modo mozo</a></span>
        </div>
      </header>
      <main className="contenedor ancho">
        <nav className="tabs">
          {TABS.map(([t, n]) => <a key={t} href={`?tab=${t}`} className={t === tab ? "activa" : ""}>{n}</a>)}
        </nav>
        {sp.ok && <div className="aviso ok">Guardado.</div>}
        {sp.error && <div className="aviso error">Falta el título del beneficio.</div>}
        {tab === "beneficios" && <TabBeneficios local={local} editar={sp.editar} />}
        {tab === "miembros" && <TabMiembros local={local} />}
        {tab === "informe" && <TabInforme local={local} mes={sp.mes} />}
        {tab === "local" && <TabLocal local={local} />}
      </main>
    </>
  );
}

async function TabBeneficios({ local, editar }: { local: Local; editar?: string }) {
  const lista = await getBeneficios(local.id, false);
  const b = lista.find((x) => x.id === editar);
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <section>
        <h2>Tus beneficios</h2>
        {lista.length === 0 && <p className="suave">Todavía no hay. Empezá con un regalo de bienvenida chico (un café, un postre) y uno para las tardes flojas.</p>}
        {lista.map((x) => (
          <div key={x.id} className={`tarjeta ${x.activo ? "" : "apagada"}`}>
            <div className="fila entre">
              <strong>{x.titulo}</strong>
              <span className="fila">
                {x.es_bienvenida && <span className="etiqueta">Bienvenida</span>}
                {!x.activo ? <span className="etiqueta">Pausado</span> : !x.es_bienvenida && vigenteAhora(x) ? <span className="etiqueta vivo">Activo ahora</span> : null}
              </span>
            </div>
            <div className="suave">{x.es_bienvenida ? "Al sumarse, una vez" : describirCuando(x)}</div>
            <div className="fila" style={{ marginTop: 8 }}>
              <a className="btn secundario chico" href={`?tab=beneficios&editar=${x.id}`}>Editar</a>
              <form action={alternarBeneficio.bind(null, local.slug, x.id)}>
                <button className="btn secundario chico">{x.activo ? "Pausar" : "Reactivar"}</button>
              </form>
            </div>
          </div>
        ))}
      </section>
      <section className="tarjeta">
        <h2>{b ? "Editar beneficio" : "Nuevo beneficio"}</h2>
        <FormBeneficio slug={local.slug} b={b} />
      </section>
    </div>
  );
}

function FormBeneficio({ slug, b }: { slug: string; b?: Beneficio }) {
  const dias = b?.dias ?? [1, 2, 3];
  return (
    <form action={guardarBeneficio.bind(null, slug)} key={b?.id ?? "nuevo"}>
      {b && <input type="hidden" name="id" value={b.id} />}
      <label htmlFor="titulo">Título</label>
      <input id="titulo" name="titulo" type="text" defaultValue={b?.titulo} placeholder="2x1 en cafés" required />
      <label htmlFor="descripcion">Detalle (opcional)</label>
      <textarea id="descripcion" name="descripcion" rows={2} defaultValue={b?.descripcion} placeholder="Con cualquier medialuna o tostado" />
      <label htmlFor="tipo">Tipo</label>
      <select id="tipo" name="tipo" defaultValue={b?.tipo ?? "2x1"}>
        <option value="porcentaje">% de descuento</option>
        <option value="2x1">2x1</option>
        <option value="regalo">Regalo</option>
        <option value="otro">Otro</option>
      </select>
      <label>Días</label>
      <div className="dias">
        {DIAS.map((d, i) => (
          <label key={d}><input type="checkbox" name="dias" value={i} defaultChecked={dias.includes(i)} /> {d}</label>
        ))}
      </div>
      <div className="fila">
        <div style={{ flex: 1 }}><label htmlFor="desde">Desde</label><input id="desde" name="desde" type="time" defaultValue={hhmm(b?.hora_desde ?? 900).replace("24:00", "00:00")} /></div>
        <div style={{ flex: 1 }}><label htmlFor="hasta">Hasta</label><input id="hasta" name="hasta" type="time" defaultValue={hhmm(b?.hora_hasta ?? 1140).replace("24:00", "00:00")} /></div>
      </div>
      <label className="check" style={{ marginTop: 12 }}>
        <input type="checkbox" name="es_bienvenida" defaultChecked={b?.es_bienvenida} /> Es el regalo de bienvenida (se entrega una sola vez al sumarse)
      </label>
      <button className="btn bloque" style={{ marginTop: 12 }}>Guardar</button>
      {b && <p style={{ textAlign: "center" }}><a href="?tab=beneficios">Cancelar</a></p>}
    </form>
  );
}

async function TabMiembros({ local }: { local: Local }) {
  const filas = await q<{ nombre: string; telefono: string; acepta_whatsapp: boolean; created_at: string; canjes: number; ultimo: string | null }>(
    `SELECT m.nombre, m.telefono, m.acepta_whatsapp, m.created_at, count(c.canjeado_at)::int AS canjes, max(c.canjeado_at) AS ultimo
       FROM miembros m LEFT JOIN cupones c ON c.miembro_id = m.id
      WHERE m.local_id = $1 AND m.baja_at IS NULL GROUP BY m.id ORDER BY m.created_at DESC LIMIT 500`,
    [local.id],
  );
  return (
    <section>
      <div className="fila entre">
        <h2>{filas.length} miembros</h2>
        <a className="btn secundario chico" href={`/${local.slug}/panel/miembros.csv`}>Exportar CSV</a>
      </div>
      <p className="suave">Solo escribiles por WhatsApp a quienes aceptaron recibir novedades. Si alguien pide la baja, se borra de esta lista.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Nombre</th><th>WhatsApp</th><th>Novedades</th><th>Alta</th><th>Canjes</th><th>Último</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.telefono}>
                <td>{f.nombre}</td><td>+{f.telefono}</td><td>{f.acepta_whatsapp ? "Sí" : "No"}</td>
                <td>{fechaAR(f.created_at)}</td><td>{f.canjes}</td><td>{f.ultimo ? fechaAR(f.ultimo) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function TabInforme({ local, mes }: { local: Local; mes?: string }) {
  const m = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesActualAR();
  const r = await informeMes(local.id, m);
  const max = Math.max(1, ...r.porDia.map((d) => d.canjes));
  const nombreMes = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T00:00:00Z`));
  const resumen =
    `Informe yapa · ${local.nombre} · ${nombreMes}\n` +
    `• ${r.nuevos} miembros nuevos (${r.total} en total)\n` +
    `• ${r.volvieron} volvieron después de sumarse\n` +
    `• ${r.canjes} beneficios usados (${r.canjes_vuelta} de vuelta)`;
  return (
    <section>
      <form className="fila" style={{ marginBottom: 12 }}>
        <input type="hidden" name="tab" value="informe" />
        <input type="text" name="mes" defaultValue={m} pattern="\d{4}-\d{2}" style={{ maxWidth: 140 }} aria-label="Mes (AAAA-MM)" />
        <button className="btn secundario chico">Ver mes</button>
      </form>
      <h2>{nombreMes[0].toUpperCase() + nombreMes.slice(1)}</h2>
      <div className="kpis">
        <div className="tarjeta kpi"><div className="num">{r.nuevos}</div><div className="suave">miembros nuevos</div></div>
        <div className="tarjeta kpi"><div className="num">{r.volvieron}</div><div className="suave">volvieron después de sumarse</div></div>
        <div className="tarjeta kpi"><div className="num">{r.canjes}</div><div className="suave">beneficios usados</div></div>
        <div className="tarjeta kpi"><div className="num">{r.total}</div><div className="suave">miembros en total ({r.con_wa} aceptan WhatsApp)</div></div>
      </div>
      <div className="tarjeta">
        <h3>Canjes por día</h3>
        {DIAS.map((d, i) => {
          const c = r.porDia.find((x) => x.dia === i)?.canjes ?? 0;
          return (
            <div key={d} className="fila" style={{ margin: "4px 0" }}>
              <span style={{ width: 36 }}>{d}</span>
              <div className="barra" style={{ width: `${(c / max) * 70}%`, minWidth: c ? 4 : 0 }} />
              <span className="suave">{c}</span>
            </div>
          );
        })}
      </div>
      <div className="tarjeta">
        <h3>Por beneficio</h3>
        <table><tbody>{r.porBeneficio.map((b) => <tr key={b.titulo}><td>{b.titulo}</td><td>{b.canjes}</td></tr>)}</tbody></table>
      </div>
      <div className="tarjeta">
        <h3>Para mandarle al dueño</h3>
        <textarea readOnly rows={5} defaultValue={resumen} />
      </div>
    </section>
  );
}

async function TabLocal({ local }: { local: Local }) {
  const url = `${baseUrl()}/${local.slug}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#13292C", light: "#ffffff" } });
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <section className="tarjeta">
        <h2>Datos del local</h2>
        <form action={guardarLocal.bind(null, local.slug)}>
          <label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" type="text" defaultValue={local.nombre} />
          <label htmlFor="descripcion">Sobre el local</label><textarea id="descripcion" name="descripcion" rows={3} defaultValue={local.descripcion} />
          <label htmlFor="direccion">Dirección</label><input id="direccion" name="direccion" type="text" defaultValue={local.direccion} />
          <label htmlFor="horarios">Horarios</label><textarea id="horarios" name="horarios" rows={3} defaultValue={local.horarios} />
          <label htmlFor="instagram">Instagram</label><input id="instagram" name="instagram" type="text" defaultValue={local.instagram} placeholder="@tulocal" />
          <label htmlFor="carta_url">Link a la carta</label><input id="carta_url" name="carta_url" type="url" defaultValue={local.carta_url} />
          <label htmlFor="whatsapp">WhatsApp del local</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={local.whatsapp} />
          <label htmlFor="fotos">Fotos (links, uno por línea)</label><textarea id="fotos" name="fotos" rows={3} defaultValue={local.fotos.join("\n")} />
          <label htmlFor="pin_mozo">PIN del mozo</label><input id="pin_mozo" name="pin_mozo" type="text" inputMode="numeric" defaultValue={local.pin_mozo} />
          <button className="btn bloque" style={{ marginTop: 12 }}>Guardar</button>
        </form>
      </section>
      <section className="tarjeta" style={{ textAlign: "center" }}>
        <h2>QR para las mesas</h2>
        <div style={{ maxWidth: 260, margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="suave">{url}</p>
        <a className="btn secundario chico" download={`qr-${local.slug}.svg`} href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`}>Descargar QR</a>
        <p className="suave" style={{ marginTop: 16 }}>Modo mozo: <a href={`/${local.slug}/mozo`}>{baseUrl()}/{local.slug}/mozo</a> (PIN {local.pin_mozo})</p>
      </section>
    </div>
  );
}
