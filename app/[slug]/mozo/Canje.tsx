"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ResultadoCanje } from "@/lib/datos";

export function Canje({ accion }: { accion: (p: ResultadoCanje | null, f: FormData) => Promise<ResultadoCanje> }) {
  const [res, enviar, pendiente] = useActionState(accion, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (res) ref.current?.reset(); }, [res]);
  return (
    <>
      <form ref={ref} action={enviar}>
        <label htmlFor="codigo">Código del cliente</label>
        <input id="codigo" name="codigo" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
          autoComplete="off" autoFocus required className="teclado" placeholder="0000" />
        <button className="btn bloque" style={{ marginTop: 12 }} disabled={pendiente}>{pendiente ? "Validando…" : "Canjear"}</button>
      </form>
      {res && (res.ok ? (
        <div className="aviso ok" role="status" style={{ fontSize: 20 }}>✓ Válido: <strong>{res.beneficio}</strong> para {res.miembro}</div>
      ) : (
        <div className="aviso error" role="status" style={{ fontSize: 18 }}>✗ {res.motivo}</div>
      ))}
    </>
  );
}
