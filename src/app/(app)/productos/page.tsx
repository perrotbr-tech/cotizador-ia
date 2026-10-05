export const metadata = { title: 'Productos · Cotizador IA' }

export default function PaginaProductos() {
  return (
    <>
      <h1>Productos</h1>
      <p className="subtitulo">
        Aquí van los productos guardados con su último precio, tienda y fecha.
      </p>

      <div className="vacio">
        <p>Todavía no hay productos guardados.</p>
        <p className="pista">
          Los productos se guardan al elegir un candidato: es el alcance del paso 6 de la guía.
        </p>
      </div>
    </>
  )
}
