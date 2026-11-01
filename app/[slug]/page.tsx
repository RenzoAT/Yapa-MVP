import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cookieMiembro, getBeneficios, getLocal, getMiembro } from "@/lib/datos";
import { describirCuando, vigenteAhora } from "@/lib/tiempo";
import { CONSENTIMIENTO, CONSENTIMIENTO_WA } from "@/lib/util";
import { Pie } from "../Marca";
import { sumarse, usarBeneficio } from "./acciones";

export const dynamic = "force-dynamic";

const ICONO = { porcentaje: "", "2x1": "", regalo: "🎁 ", otro: "" } as const;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function PaginaLocal({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const local = await getLocal(slug);
  if (!local) notFound();
  const miembro = await getMiembro(local.id, (await cookies()).get(cookieMiembro(local.id))?.value);
  const beneficios = await getBeneficios(local.id);

  return (
    <>
      <header className="cabecera">
        <div className="contenedor">
          <h1>{local.nombre}</h1>
          <div>{miembro ? `Hola, ${miembro.nombre.split(" ")[0]}. Sos parte del club.` : "Sumate al club y aprovechá beneficios cada vez que vuelvas."}</div>
          <nav className="fila" style={{ marginTop: 12 }}>
            <a href="#beneficios">Beneficios</a>·<a href="#local">Conocé el local</a>
            {!miembro && <>·<a href="#sumate">Sumate</a></>}
          </nav>
        </div>
      </header>

      <main className="contenedor">
        {sp.aviso && <div className="aviso error">{sp.aviso}</div>}
        {sp.baja && <div className="aviso ok">Listo, te diste de baja y borramos tu acceso. Podés volver cuando quieras.</div>}
        {sp.bienvenido && <div className="aviso ok">¡Bienvenido al club!</div>}

        <section id="beneficios">
          <h2>Beneficios</h2>
          {beneficios.length === 0 && <p className="suave">Pronto vas a ver beneficios acá.</p>}
          {beneficios.map((b) => {
            const vivo = b.es_bienvenida || vigenteAhora(b);
            return (
              <div key={b.id} className={`tarjeta ${vivo ? "" : "apagada"}`}>
                <div className="fila entre">
                  <strong style={{ fontSize: 18 }}>{ICONO[b.tipo]}{b.titulo}</strong>
                  {b.es_bienvenida ? <span className="etiqueta">Bienvenida</span> : vivo ? <span className="etiqueta vivo">Disponible ahora</span> : null}
                </div>
                {b.descripcion && <p style={{ margin: "6px 0" }}>{b.descripcion}</p>}
                <div className="suave">{b.es_bienvenida ? "Una vez, al sumarte" : describirCuando(b)}</div>
                {miembro && vivo && (
                  <form action={usarBeneficio.bind(null, slug, b.id)} style={{ marginTop: 10 }}>
                    <button className="btn bloque">Usar ahora</button>
                  </form>
                )}
              </div>
            );
          })}
          {!miembro && beneficios.length > 0 && <p className="suave">Los beneficios son solo para miembros. <a href="#sumate">Sumate en 20 segundos.</a></p>}
        </section>

        {!miembro && (
          <section id="sumate" className="tarjeta">
            <h2>Sumate al club</h2>
            {sp.error && <div className="aviso error">Completá tu nombre, un WhatsApp válido y aceptá las condiciones.</div>}
            <form action={sumarse.bind(null, slug)}>
              <label htmlFor="nombre">Tu nombre</label>
              <input id="nombre" name="nombre" type="text" autoComplete="given-name" required />
              <label htmlFor="telefono">Tu WhatsApp</label>
              <input id="telefono" name="telefono" type="tel" inputMode="tel" placeholder="11 2345 6789" autoComplete="tel" required />
              <label className="check"><input type="checkbox" name="acepta" required /> {CONSENTIMIENTO}</label>
              <label className="check"><input type="checkbox" name="acepta_wa" /> {CONSENTIMIENTO_WA} (opcional)</label>
              <button className="btn bloque" style={{ marginTop: 14 }}>Sumarme</button>
              <p className="suave">¿Ya eras miembro en otro celular? Poné el mismo WhatsApp y recuperás tu cuenta.</p>
            </form>
          </section>
        )}

        <section id="local">
          <h2>Conocé el local</h2>
          <div className="tarjeta">
            {local.descripcion && <p style={{ marginTop: 0 }}>{local.descripcion}</p>}
            {local.fotos.length > 0 && (
              <div className="fotos">{local.fotos.map((f) => <img key={f} src={f} alt={`Foto de ${local.nombre}`} />)}</div>
            )}
            {local.direccion && (
              <p>📍 <a href={`https://maps.google.com/?q=${encodeURIComponent(local.direccion)}`} target="_blank">{local.direccion}</a></p>
            )}
            {local.horarios && <p style={{ whiteSpace: "pre-line" }}>🕒 {local.horarios}</p>}
            <div className="fila">
              {local.carta_url && <a className="btn secundario chico" href={local.carta_url} target="_blank">Ver la carta</a>}
              {local.instagram && <a className="btn secundario chico" href={`https://instagram.com/${local.instagram.replace(/^@/, "")}`} target="_blank">Instagram</a>}
              {local.whatsapp && <a className="btn secundario chico" href={`https://wa.me/${local.whatsapp.replace(/\D/g, "")}`} target="_blank">WhatsApp</a>}
            </div>
          </div>
        </section>

        {miembro && <p className="suave" style={{ textAlign: "center" }}><a href={`/${slug}/baja`}>Darme de baja del club</a></p>}
      </main>
      <Pie />
    </>
  );
}
