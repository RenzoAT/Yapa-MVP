import { notFound } from "next/navigation";
import { getLocal } from "@/lib/datos";
import { esMozo } from "@/lib/auth";
import { canjearCodigo, loginMozo } from "./acciones";
import { Canje } from "./Canje";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> };

export default async function Mozo({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const local = await getLocal(slug);
  if (!local) notFound();

  return (
    <main className="contenedor">
      <p className="suave" style={{ marginBottom: 0 }}>{local.nombre} · modo mozo</p>
      {(await esMozo(local)) ? (
        <>
          <h1>Canjear beneficio</h1>
          <Canje accion={canjearCodigo.bind(null, slug)} />
        </>
      ) : (
        <>
          <h1>Entrar</h1>
          {error && <div className="aviso error">PIN incorrecto.</div>}
          <form action={loginMozo.bind(null, slug)}>
            <label htmlFor="pin">PIN del local</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" className="teclado" required autoFocus />
            <button className="btn bloque" style={{ marginTop: 12 }}>Entrar</button>
          </form>
        </>
      )}
    </main>
  );
}
