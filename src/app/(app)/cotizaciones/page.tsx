export const metadata = { title: 'Cotizaciones · Cotizador IA' }

export default function PaginaCotizaciones() {
  return (
    <>
      <h1>Cotizaciones</h1>
      <p className="subtitulo">
        Aquí van las cotizaciones con su código, cliente final, fecha, estado y total.
      </p>

      <div className="vacio">
        <p>Todavía no hay cotizaciones.</p>
        <p className="pista">
          Crear una cotización y leer la solicitud es el alcance del paso 2 de la guía.
        </p>
      </div>
    </>
  )
}
