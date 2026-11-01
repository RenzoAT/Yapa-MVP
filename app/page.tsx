import { Marca } from "./Marca";

export default function Inicio() {
  return (
    <main className="contenedor">
      <h1 style={{ fontSize: 44, marginTop: 40 }}><Marca /></h1>
      <p>Club de clientes para tu local. Tus clientes se suman con un QR en la mesa, reciben beneficios para volver en los horarios flojos, y vos recibís un informe por mes.</p>
      <p className="suave">Cada local tiene su página en <code>/nombre-del-local</code>.</p>
    </main>
  );
}
