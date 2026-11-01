import { darseDeBaja } from "../acciones";

type Props = { params: Promise<{ slug: string }> };

export default async function Baja({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="contenedor">
      <h1>Darte de baja</h1>
      <p>Vas a dejar de ser miembro y el local no te va a poder escribir. Tus beneficios sin usar se pierden.</p>
      <form action={darseDeBaja.bind(null, slug)}>
        <button className="btn bloque">Sí, darme de baja</button>
      </form>
      <p style={{ textAlign: "center" }}><a href={`/${slug}`}>No, volver</a></p>
    </main>
  );
}
