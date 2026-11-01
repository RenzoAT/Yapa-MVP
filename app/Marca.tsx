export function Marca() {
  return <span className="marca">yapa<b>.</b></span>;
}
export function Pie() {
  return (
    <footer className="pie suave">
      Club de clientes con <Marca />
    </footer>
  );
}
