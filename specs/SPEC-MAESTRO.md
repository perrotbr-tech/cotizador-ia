# Spec maestro — Buscador y cotizador con agente IA

**Perrot Tech · Soluciones con IA para pymes**
Código: PT-COT-2026-001 · Fecha: 5 de octubre de 2026 · Documento interno de trabajo

Proyecto para una empresa comercializadora y distribuidora de Santiago que cotiza insumos y materiales de empresa, útiles escolares, tecnología y alimentos, a clientes privados y en Mercado Público, donde ya está inscrita como proveedora.

Este documento define qué se construye, en qué orden y con qué criterio se da por terminada cada parte. Cada subetapa (E0, E1.1 a E1.6, E2.1 a E2.4) es una unidad de trabajo que se aprueba antes de construir y se cierra con contraprueba.

**Cómo se nombra a cada actor en este documento**

| Nombre | A quién se refiere |
|---|---|
| La empresa | La comercializadora y distribuidora para la que se construye el sistema |
| Cliente final | Quien le pide una cotización a la empresa: un colegio, una oficina, un organismo público |
| Mayorista | A quien la empresa le compra los productos que revende |
| Servicio tecnológico | Cada plataforma de terceros que el sistema usa por suscripción o por consumo |

---

## 1. Resumen

**Qué se construye.** Una aplicación web donde el equipo comercial de la empresa carga la solicitud de un cliente final (Excel, PDF, foto o texto). Un agente de IA identifica cada producto, busca su costo en el historial de la empresa y en sitios web de mayoristas y comercios chilenos, y arma la cotización con margen. Una persona la revisa y la envía. En la segunda etapa, un agente lee Mercado Público todos los días, encuentra las Compras Ágiles y licitaciones que calzan con lo que la empresa vende, las puntúa y las deja listas para cotizar.

**Estado actual.** Nada de lo descrito está construido. Todo lo que sigue es especificación.

**Las cinco decisiones que definen el diseño**

| # | Decisión | Por qué |
|---|---|---|
| 1 | El historial de compras y cotizaciones de la propia empresa es la fuente principal de costo. La web complementa. | Dimerc y Prisa, dos mayoristas de oficina de alcance nacional, no muestran su lista de precios sin iniciar sesión, y Mercado Libre prohíbe el acceso automatizado. Canals y Proton, dos cotizadores con IA para distribuidores en Estados Unidos, cotizan contra el catálogo propio del distribuidor. |
| 2 | Es una aplicación con motor de IA intercambiable (Anthropic, OpenAI o Google). Funciona completa sin que la empresa tenga cuenta de Claude. Quien sí usa Claude o ChatGPT la conecta además como conector. | Requisito del proyecto: debe servir tanto si la empresa usa Claude como si no. |
| 3 | Ninguna cotización sale sin que una persona la apruebe. El agente no cotiza ni oferta dentro de Mercado Público. | El emparejamiento automático de productos comete errores, y las condiciones de uso de ChileCompra contemplan el bloqueo indefinido de los proveedores que operen con robots que comprometan la plataforma. |
| 4 | Mercado Público se lee por las API oficiales de ChileCompra, con un barrido cada 30 minutos, todos los días, y un resumen diario a las 08:00. | Una Compra Ágil puede cerrar a las 24 horas de publicada: una sola lectura al día llega tarde. |
| 5 | La base de datos nace multiempresa: cada dato pertenece a una empresa. | Permite a Perrot Tech reutilizar el sistema con otras empresas sin rehacerlo. |

**Cifras del proyecto**

| Concepto | Valor |
|---|---|
| Trabajo total, sumando las subetapas una tras otra | 14 semanas: 1 semana de levantamiento, 8 semanas de la etapa 1 y 5 semanas de la etapa 2 |
| Calendario, construyendo en paralelo las subetapas que no dependen entre sí | 10 semanas desde el inicio del levantamiento; la etapa 1 queda en producción en la semana 8 |
| Capacidad de diseño de la etapa 1 | 400 cotizaciones al mes de 30 líneas cada una = 12.000 líneas de producto al mes |
| Capacidad de diseño de la etapa 2 | 3.500 Compras Ágiles y 450 licitaciones leídas por día hábil, de todo Chile |
| Servicios tecnológicos de terceros durante el piloto (100 cotizaciones al mes) | USD 163,85 al mes = $159.364 al mes |
| Servicios tecnológicos de terceros, etapa 1 a capacidad de diseño | USD 393,41 al mes = $382.635 al mes |
| Servicios tecnológicos de terceros, las dos etapas a capacidad de diseño | USD 469,95 al mes = $457.072 al mes |

Estos costos son solo los servicios tecnológicos de terceros. No incluyen desarrollo, mantención ni honorarios de Perrot Tech. El piloto es el primer mes de uso real después de cerrar la subetapa E1.6. Los valores en pesos usan el dólar observado de $972,60 del 1 de octubre de 2026, publicado por el Servicio de Impuestos Internos.

**Términos usados**

| Término | Significado |
|---|---|
| API | Canal por el que dos sistemas intercambian datos de forma automática |
| Token | Unidad en que los modelos de IA miden y cobran el texto; es un trozo de palabra |
| Vector de búsqueda | Representación numérica de un texto que permite encontrar productos por significado y no solo por palabras iguales |
| Alias | Otra forma de escribir un producto, guardada para reconocerlo la próxima vez |
| robots.txt | Archivo público en que cada sitio web indica qué partes pueden leer los programas automáticos |
| CAPTCHA | Prueba que un sitio web pone para comprobar que quien entra es una persona |
| Ticket | Clave que ChileCompra entrega a una persona para usar sus API |
| Clave Única | Identidad digital del Estado de Chile con que cada persona entra a Mercado Público |
| Compra Ágil | Compra pública de hasta 100 UTM que se resuelve con cotizaciones |
| Convenio Marco y Trato Directo | Otras dos modalidades de compra pública, fuera del alcance de este proyecto |
| UTM y UF | Unidad Tributaria Mensual y Unidad de Fomento, unidades reajustables en pesos |
| UNSPSC | Clasificador de productos de Naciones Unidas que usa Mercado Público |
| ERP | Sistema de gestión donde una empresa registra compras, ventas e inventario |
| Conector | Enlace que permite usar el sistema desde el chat de Claude o de ChatGPT |
| Errores 403, 429 y 500 | Respuestas de un sistema: acceso denegado, demasiadas consultas y falla interna |

---

## 2. El problema y la evidencia

### Cotizar a clientes finales privados

- **Los precios de productos comparables varían mucho entre comercios.** El Servicio Nacional del Consumidor midió en útiles escolares diferencias de hasta 3.527 % en un lápiz pasta (de $110 a $3.990) y de 1.890 % en una goma de borrar, entre productos de características similares ([SERNAC, 9 de febrero de 2026](https://www.sernac.cl/portal/604/w3-article-88088.html)). Con esa dispersión, el costo que se toma como base cambia el precio final de la cotización.
- **Los precios no vienen en el mismo formato.** Prisa expresa sus ofertas como precio neto más IVA; Falabella, Sodimac y SP Digital publican con impuestos incluidos; PC Factory muestra un precio distinto según el medio de pago; Alvi tiene precio por tramo de cantidad; Central Mayorista exige compra mínima por producto. Comparar a mano obliga a convertir cada precio.
- **El Estado ya midió cuánto cuesta no comparar.** La Dirección de Presupuestos calculó un sobregasto de $10.615 millones en 2022 y 2023 (3,6 % del gasto analizado) por no comprar al precio mínimo disponible en Convenio Marco. Alimentos concentra el 72,8 %; siguen aseo, ferretería y artículos de escritorio ([DIPRES, abril de 2025](https://www.dipres.gob.cl/598/articles-366422_doc_pdf.pdf)). Son rubros que la empresa vende.
- **La rapidez de respuesta pesa en la venta.** Un estudio de Harvard Business Review sobre 1,25 millones de contactos comerciales recibidos por internet en 42 empresas de Estados Unidos encontró que responder dentro de la primera hora hace "casi siete veces" más probable calificar al cliente que responder una hora después ([HBR, marzo de 2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads)).

### Cotizar en Mercado Público

- **Compra Ágil casi duplicó su monto.** En 2025 sumó 787.211 órdenes de compra por USD 1.166 millones, 81,5 % más que en 2024 en términos reales. El 82,9 % de ese monto fue a empresas de menor tamaño ([ChileCompra, 9 de febrero de 2026](https://www.chilecompra.cl/2026/02/obras-publicas-y-salud-impulsan-dinamismo-de-las-compras-publicas-con-fuerte-retroceso-del-trato-directo/)).
- **Cada compra es más grande.** El tope subió de 30 a 100 UTM el 12 de diciembre de 2024. Con la UTM de octubre de 2026 ($72.151), 100 UTM = $7.215.100. El monto promedio por orden pasó de USD 800 a un rango de USD 1.400 a USD 1.600 ([ChileCompra, estudio de junio de 2025](https://www.chilecompra.cl/wp-content/uploads/2026/01/Transacciones-CompraAgil-semestre1-2025.pdf)).
- **El volumen diario es alto.** Se publican más de 3.000 oportunidades de Compra Ágil por día ([Ministerio de Hacienda, 16 de junio de 2025](https://www.hacienda.cl/subsecretaria/noticias/empresas-de-menor-tamano-vendieron-us-287-millones-mediante-nueva-compra-agil)). En licitaciones, la API de datos abiertos de ChileCompra registra 111.897 publicadas en 2025 = 9.325 al mes ([Datos Abiertos de ChileCompra](https://datos-abiertos.chilecompra.cl/descargas/procesos-ocds)).
- **El plazo es corto.** Una Compra Ágil debe estar publicada un mínimo de 24 horas ([Directiva de Contratación Pública N.º 35, 22 de diciembre de 2025](https://www.chilecompra.cl/wp-content/uploads/2025/12/563BRes-Directiva35CompraAgil.pdf)).
- **La regla general es el menor precio.** La ley exige fundamentar en la orden de compra cuando el organismo no elige la oferta de menor precio ([Ley 19.886, artículo 7, letra d](https://www.bcn.cl/leychile/navegar?idNorma=213004)).
- **El primer llamado es para empresas de menor tamaño y proveedores locales.** Solo si ninguno de ellos cotiza, el sistema de Mercado Público abre el proceso a los demás proveedores ([Decreto 661 de 2024 del Ministerio de Hacienda, artículo 97](https://www.bcn.cl/leychile/navegar?idNorma=1209290)).
- **El aviso gratuito de la plataforma tiene un alcance limitado.** Mercado Público envía correos por rubro inscrito, pero sus propias condiciones de uso dicen que esos correos "sólo constituyen medios de difusión" y que el proveedor debe revisar la plataforma de forma permanente ([Condiciones de uso de ChileCompra](https://www.chilecompra.cl/terminos-y-condiciones-de-uso/)). El aviso llega según los rubros inscritos; no conoce los costos de la empresa ni calcula margen.

### Qué prueba esta evidencia y qué no

**Prueba** que hay muchas oportunidades pequeñas, con poco tiempo para responder, donde la regla general es el menor precio, y que los precios de los productos que vende la empresa tienen una dispersión grande y medida.

**No prueba** cuánto demora hoy esta empresa en cada cotización, cuántas emite ni cuántas gana. No existe un estudio independiente que lo mida para distribuidoras chilenas. Por eso la subetapa E0 mide esos tres números en la operación real de la empresa antes de construir: son la línea base contra la que se demuestra el resultado.

---

## 3. Qué existe hoy en el mercado

### Productos que ya avisan oportunidades de Mercado Público

Planes publicados en el sitio de cada producto el 5 de octubre de 2026. Los valores en UF se muestran también en pesos con la UF de ese día ($41.098,15).

| Producto | Qué ofrece | Planes mensuales publicados |
|---|---|---|
| [Marko](https://marko.cl/) | Alertas, cotizador, comparación de precios entre los mayoristas del usuario, cobranza | 2 UF al mes = $82.196 al mes, más un pago único de implementación de 10 UF = $410.982 |
| [LicitaLAB](https://www.licitalab.cl/planes) | Búsqueda, análisis de mercado y de competencia | 2,2 UF = $90.416; 3,2 UF = $131.514; 5 UF = $205.491; todos más IVA |
| [Vendify](https://vendify.cl/) | Detección de oportunidades, análisis de bases, generación de cotizaciones | $29.990, $39.990 o $69.990, más IVA |
| [LicitaIA](https://licitaia.cl/pricing) | Alertas, precios ganadores, seguimiento de competidores | $17.990 o $52.900, IVA incluido |
| [PIAM](https://piam.cl/) | Agente que filtra y avisa por WhatsApp y correo | $17.990, $21.990 o desde $39.990 |
| [AdjudicaPro](https://adjudicapro.cl/) | Monitoreo, revisión de requisitos, borradores de oferta | $0, $5.990 o $19.990 |
| [AlertasMP](https://alertasmp.cl/) | Alertas por Telegram | 0,4 UF = $16.439 |

ChileCompra anunció además para 2026 un comparador inteligente de precios para los compradores públicos, que vincula las descripciones de productos con Convenio Marco y precios de comercios ([Cuenta Pública de ChileCompra, julio de 2026](https://www.chilecompra.cl/2026/07/cuenta-publica-participativa-de-chilecompra-destaca-ahorros-por-us-381-millones-en-2025-y-presenta-nuevas-herramientas-con-inteligencia-artificial-para-2026/)).

### Qué hace distinto este proyecto

Avisar oportunidades es un servicio que ya se compra desde $5.990 al mes. Si la empresa solo necesitara avisos, contratar uno de esos productos costaría menos que construir.

Este proyecto se justifica por lo que esos productos no tienen: **el costo real de la empresa**. Como la etapa 1 deja ordenado el catálogo propio con su último costo de compra, la etapa 2 no solo avisa "apareció una compra de resmas". Ejemplo de lo que entrega: "apareció una compra de 200 resmas, la empresa las compra a $3.100 cada una, el presupuesto publicado deja 14 % de margen y cierra mañana a las 15:00", con la cotización ya armada. Sin la etapa 1, la etapa 2 ofrece lo mismo que los productos de alertas existentes.

### Referentes para la etapa 1

- **[Canals](https://www.canals.ai/products/distributor-order-entry) y [Proton](https://www.proton.ai/order-and-quote-entry)** (Estados Unidos): leen solicitudes en correo, PDF y planillas, emparejan cada ítem con el catálogo del distribuidor, aplican sus precios y redactan la cotización. Una persona aprueba. Es el mismo flujo de este documento.
- **[Wherex](https://wherex.com/portal-de-compras/), [Senegocia](https://cl.senegocia.com/cotizador/) e [iConstruye](https://www.iconstruye.com/gestion-de-compras/cotizaciones/)** (Chile): sirven al comprador, que pide cotización a proveedores dentro de la plataforma. No sirven al distribuidor que tiene que armar la cotización.

---

## 4. Qué es el producto

### Quién lo usa

| Rol | Qué hace en el sistema |
|---|---|
| Cotizador | Carga solicitudes, revisa lo que propone el agente, corrige, aprueba y envía cotizaciones |
| Administrador | Define márgenes, mayoristas, usuarios, perfil de búsqueda de Mercado Público y revisa el gasto en IA |
| Lector | Ve cotizaciones, oportunidades y reportes, sin modificar |

### Flujo de una cotización a un cliente final privado

1. El cotizador sube el archivo del cliente final o pega el texto.
2. El agente separa la solicitud en líneas: producto, cantidad, unidad y marca si viene indicada.
3. Para cada línea, el agente busca el producto en el catálogo de la empresa y propone el mejor calce con un nivel de confianza de 0 a 1.
4. Para cada producto, el sistema toma el último costo de compra de la empresa. Si no existe o tiene más de 30 días, busca el precio en la web y guarda la evidencia: sitio, enlace, precio, fecha y hora.
5. El sistema calcula el precio de venta con la regla de margen de esa categoría y ese cliente final, y marca en la pantalla cada línea que necesita atención.
6. El cotizador revisa, corrige lo que haga falta y aprueba.
7. El sistema genera la cotización en PDF y Excel con numeración correlativa y la envía por correo desde la aplicación.
8. El cotizador registra después si se ganó o se perdió. Ese resultado alimenta los reportes.

### Flujo de una oportunidad de Mercado Público

1. Cada 30 minutos, todos los días, el agente lee las Compras Ágiles nuevas o modificadas. Cada noche lee las licitaciones publicadas.
2. Descarta las que no calzan con el perfil de la empresa: productos, regiones de despacho, monto mínimo y máximo, palabras excluidas.
3. A las que quedan les pide el detalle, empareja cada producto solicitado con el catálogo y calcula un puntaje de 0 a 100 puntos.
4. A las 08:00 de cada día hábil envía el resumen por correo: las mejores oportunidades, con puntaje, motivo, margen y hora de cierre.
5. Cuando una oportunidad de 75 puntos o más queda a menos de 24 horas de su cierre sin que nadie de la empresa la haya abierto, envía un aviso de urgencia.
6. Con un clic, el cotizador abre la oportunidad convertida en cotización, con productos, cantidades y costos ya cargados.
7. **Una persona de la empresa entra a Mercado Público con su Clave Única y envía la cotización.** El agente no entra a la plataforma.

### Con Claude o sin Claude

| Modo | Para quién | Cómo funciona |
|---|---|---|
| Aplicación web | Todos los usuarios | Se entra con correo y contraseña desde el navegador. El motor de IA trabaja detrás, por API, con cuentas que administra Perrot Tech. La empresa no necesita cuenta en Claude ni en ChatGPT. |
| Conector | Quien ya usa Claude (planes Pro, Max, Team o Enterprise) o ChatGPT (planes Plus, Pro, Business, Enterprise o Education) | El sistema se agrega como conector y el usuario le pide desde su chat "búscame el costo de 50 resmas carta" o "muéstrame las oportunidades de hoy". El conector usa las mismas funciones de la aplicación y solo consulta o deja borradores: no aprueba ni envía. |

La aplicación web es el canal principal. El conector es un canal adicional, construido sobre el estándar abierto [Model Context Protocol](https://modelcontextprotocol.io/specification/versioning): en Claude los conectores personalizados están en fase beta ([Anthropic](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)) y en ChatGPT dependen del modo desarrollador ([OpenAI](https://developers.openai.com/api/docs/guides/developer-mode)).

---

## 5. Reglas de diseño que no se negocian

1. **Una persona aprueba todo lo que sale.** No existe envío automático de cotizaciones.
2. **Cada precio lleva su evidencia.** Fuente, enlace, fecha y hora de captura, y si es neto o con IVA. Un precio sin evidencia completa no entra a una cotización.
3. **Todos los precios se guardan en neto, en pesos y por unidad base.** Una caja de 12 se convierte a precio por unidad antes de comparar. Un precio en dólares se convierte con el dólar observado del día de la captura y se guarda también el valor original.
4. **El agente dice cuando no sabe.** La línea queda marcada para revisión si la confianza del calce es menor que 0,80 en la escala de 0 a 1, si el precio viene de una sola fuente, si el costo tiene más de 30 días o si la unidad es distinta de la pedida.
5. **El sistema propio solo lee fuentes habilitadas y no fuerza ningún acceso.** Respeta el archivo robots.txt de cada sitio según el estándar [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) y sus tiempos de espera, no inicia sesión en portales de terceros, no resuelve CAPTCHA ni evade bloqueos. La búsqueda en Google Shopping se contrata a un servicio tecnológico que obtiene esos resultados de Google por medios automatizados: es una dependencia declarada entre los riesgos de este documento.
6. **El agente no opera dentro de Mercado Público.** Lee por las API oficiales con ticket. No guarda ni usa Clave Única, en línea con el llamado de ChileCompra a no entregar la Clave Única a sistemas robotizados ([ChileCompra, 23 de julio de 2024](https://www.chilecompra.cl/2024/07/chilecompra-llama-a-proveedores-a-hacer-buen-uso-de-herramientas-robotizadas-para-ofertar-a-las-compras-del-estado/)).
7. **Lo que viene de un documento o de una página web es dato, no instrucción.** El modelo que lee una solicitud o una ficha de producto solo devuelve campos estructurados y no tiene herramientas para actuar.
8. **Ningún modelo queda escrito en el código.** Servicio y modelo son configuración. Si el servicio principal falla o responde con error de límite, la tarea se reintenta en el servicio de respaldo y el cambio queda registrado.
9. **Todo proceso largo va por cola, con reintentos y registro.** Ninguna tarea depende de que el usuario mantenga la ventana abierta.
10. **La operación diaria no depende de cargas manuales.** El historial, las listas de los mayoristas y Mercado Público entran por API, por correo procesado automáticamente o por archivo de intercambio programado.

---

## 6. Estructura técnica

### Componentes

| Componente | Tecnología | Función |
|---|---|---|
| Aplicación web y API | Next.js en Vercel, plan Pro, región São Paulo | Pantallas y API del producto. El plan gratuito de Vercel prohíbe el uso comercial ([Vercel](https://vercel.com/docs/limits/fair-use-guidelines)). |
| Base de datos, archivos y usuarios | Supabase, plan Pro, región São Paulo: Postgres con la extensión pgvector para vectores de búsqueda y la extensión pgmq para colas de tareas, almacenamiento de archivos y autenticación | Guarda todo. El plan gratuito se pausa tras 7 días sin uso y no tiene respaldos ([Supabase](https://supabase.com/pricing)). |
| Ejecución de tareas en cola | Tarea programada de Vercel cada minuto, que toma tareas de la cola de Supabase | Cada tarea dura menos de 5 minutos; las más largas se dividen en tareas menores. |
| Cargas masivas | GitHub Actions, tarea programada nocturna | Descarga y procesa los archivos mensuales de Datos Abiertos de ChileCompra, que pesan entre 30 MB y 150 MB cada uno. |
| Ambiente de prueba | Segundo proyecto en el plan gratuito de Supabase y vista previa de Vercel | Solo con datos ficticios. |
| Capa de modelos | [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) versión 7, licencia Apache 2.0 | Una sola interfaz para Anthropic, OpenAI y Google. Cambiar de servicio es cambiar configuración. |
| Modelo extractor | Claude Haiku 4.5 (USD 1 por millón de tokens de entrada, USD 5 por millón de tokens de salida) | Lee solicitudes, fichas de producto y oportunidades. Alto volumen, bajo costo. |
| Modelo razonador | Claude Sonnet 5.5 (USD 2 por millón de tokens de entrada, USD 10 por millón de tokens de salida) | Revisión final de cada cotización y redacción del resumen diario. |
| Servicio de respaldo | OpenAI, con un modelo configurado para el papel de extractor y otro para el de razonador | Entra solo cuando Anthropic falla o limita. |
| Vectores de búsqueda | Voyage voyage-4-lite (USD 0,02 por millón de tokens) | Convierte nombres de producto en vectores. Anthropic no ofrece modelo propio de vectores y recomienda Voyage. |
| Búsqueda de precios en la web | SerpApi, Google Shopping para google.cl | Devuelve producto, precio, comercio y enlace. |
| Lectura de fichas de producto | Firecrawl | Abre la ficha de los productos candidatos, incluidas las que cargan el precio con JavaScript, para confirmar precio y disponibilidad. |
| Correo | Resend. Plan gratuito (3.000 correos al mes y 100 al día) en la etapa 1; plan Pro (USD 20 al mes) desde la etapa 2 | Envío de cotizaciones, resumen diario y avisos. A capacidad de diseño la etapa 2 envía 78 correos al día. |
| Datos de Mercado Público | API de Compra Ágil, API de licitaciones y órdenes de compra, y Datos Abiertos de ChileCompra | Etapa 2. Gratuitos. Las API requieren ticket. |

La búsqueda de precios y la lectura de fichas están detrás de una interfaz propia: reemplazar SerpApi o Firecrawl por otro servicio no toca el resto del sistema.

### De dónde salen los precios

**Nivel 1 — Historial de la empresa.** Facturas de compra y cotizaciones anteriores. Entrega el último costo neto por producto y mayorista, y el precio al que se vendió. Es la fuente preferida: es el costo real, negociado, y no depende de terceros.

**Nivel 2 — Mayoristas donde la empresa tiene cuenta.** Dimerc, Prisa, Intcomex, Ingram Micro y Tecnoglobal muestran su lista de precios solo a clientes con sesión iniciada. El sistema no automatiza esas sesiones. El camino es pedir a cada ejecutivo de cuenta un acceso de integración: Intcomex ofrece una API para clientes con lista de precios diaria e inventario cada hora ([Intcomex](https://iws.intcomex.com/webServices/que-es-iws.html)), Ingram Micro ofrece una API para distribuidores con precio y disponibilidad en línea ([Ingram Micro](https://developer.ingrammicro.com/reseller)), y a los demás se les pide el envío programado de su lista de precios a una casilla de correo del sistema, que la procesa sola.

**Nivel 3 — Sitios con precio público.** Lista inicial de sitios cuyo precio se ve sin iniciar sesión y cuyo robots.txt deja abiertas las fichas de producto, según la lectura del 5 de octubre de 2026:

| Categoría | Sitios | Cómo publican el precio |
|---|---|---|
| Útiles y oficina | Lápiz López, Nacional | Precio a público general. |
| Tecnología | PC Factory, SP Digital, Wei, Winpy, MyShop | Precio a público general. SP Digital pide 5 segundos entre consultas y Winpy 10 segundos. PC Factory publica dos precios según medio de pago: se guarda el de transferencia. |
| Alimentos y abarrotes | Jumbo, Alvi, Central Mayorista | Alvi publica precio por tramo de cantidad: se guarda cada tramo y se usa el que corresponde a la cantidad pedida. Central Mayorista vende solo a comerciantes inscritos y exige compra mínima: se usa solo si la empresa está inscrita. |
| Aseo, ferretería y general | Sodimac, Falabella, Paris | Sodimac y Falabella publican con impuestos incluidos, y sus condiciones prohíben reproducir imágenes y textos: de ellos se guarda solo nombre, precio y enlace. |

Cada sitio tiene una ficha en la política de fuentes del sistema. Un sitio pasa a estado habilitado cuando esa ficha tiene tres datos: robots.txt leído, condiciones de uso revisadas con su fecha, y forma en que el sitio expresa el IVA. La subetapa E1.4 completa esas fichas para la lista inicial, y ningún precio de un sitio no habilitado entra a una cotización.

En todos los sitios se leen únicamente fichas de producto. PC Factory, Sodimac y Nacional, entre otros, vedan su buscador interno a los programas automáticos en su robots.txt: el sistema llega a la ficha desde Google Shopping y no usa el buscador de ningún sitio. Antes de pedir cada ficha, el sistema comprueba él mismo el robots.txt del sitio.

**Fuentes excluidas**

| Fuente | Motivo |
|---|---|
| Mercado Libre | Sus condiciones de uso prohíben "el uso de sistemas automatizados (incluyendo, sin limitarse a, bots, spiders, scrapers o crawlers)" sin autorización expresa ([cláusula 12, actualizada el 30 de septiembre de 2026](https://www.mercadolibre.cl/ayuda/terminos-y-condiciones-de-uso_991)); su robots.txt bloquea a los agentes de Claude y ChatGPT; su API de búsqueda respondió con error 403 en la prueba hecha el 5 de octubre de 2026. |
| Dimerc, lectura del sitio | Sus condiciones limitan el uso del sitio a "fines de información personal, no pudiendo hacer uso del mismo para fines comerciales" ([Dimerc](https://www.dimerc.cl/terminos-condiciones)). Con Dimerc se trabaja solo por el acceso de integración que se pide a los mayoristas con cuenta. |
| Lider | El 5 de octubre de 2026 el sitio presentó una verificación contra robots a un navegador común. |

**Marco legal que respeta el diseño.** La Ley 21.459 castiga el acceso a un sistema "sin autorización o excediendo la autorización que posea y superando barreras técnicas o medidas tecnológicas de seguridad" ([artículo 2](https://www.bcn.cl/leychile/navegar?idNorma=1177743)): por eso el sistema no inicia sesión en sitios de terceros ni evade bloqueos. La Ley 17.336 protege las compilaciones de datos pero aclara que "esta protección no abarca los datos o materiales en sí mismos" ([artículo 3, número 17](https://www.bcn.cl/leychile/navegar?idNorma=28933)): por eso se guarda el precio como dato, con su enlace, y no se copian catálogos, imágenes ni descripciones.

### Cómo empareja productos el agente

1. **Normaliza** la línea: separa nombre, marca, modelo, medida, contenido y unidad. "Resma carta 75g Chamex x 10" pasa a producto = resma de papel carta de 75 g, marca = Chamex, cantidad = 10, unidad = resma.
2. **Busca candidatos** en el catálogo de la empresa por significado (vectores) y por texto exacto (códigos, modelos), y se queda con los 10 mejores.
3. **Elige** con el modelo extractor, que recibe la línea y los 10 candidatos y devuelve el elegido, la confianza de 0 a 1 y el motivo.
4. **Decide el sistema, no el modelo.** Confianza de 0,80 o más = propuesto. Menos de 0,80 = revisión obligatoria. Sin candidato = producto nuevo, que se busca en la web y se agrega al catálogo cuando el cotizador lo confirma.
5. **Aprende de cada corrección.** Cuando el cotizador cambia un calce, la descripción original queda guardada como alias del producto correcto. La siguiente vez que llegue escrita igual, el sistema propone ese producto con la marca "calce aprendido". El administrador ve la lista de alias y deshace cualquiera.
6. **Cuando el cliente final no pide marca,** el sistema propone el producto de menor costo entre los de la misma categoría y especificación, con la marca "alternativa".

Un estudio de la Universidad de Mannheim midió esta tarea con un modelo de lenguaje de 2023: al decidir si dos ofertas en inglés corresponden al mismo producto, obtuvo un índice F1 (medida combinada de acierto, de 0 % a 100 %) de 82 % sin ejemplos y de 90 % con ejemplos ([Peeters y Bizer, 2023](https://arxiv.org/abs/2305.03423)). El acierto de este sistema se mide con líneas reales de la empresa en la subetapa E1.4, y la revisión humana es obligatoria en todos los casos.

### Cómo se define el costo de cada línea

| Situación | Costo que usa la línea | Marca visible |
|---|---|---|
| Hay costo de compra propio de 30 días o menos | El de la compra más reciente. Se muestra además el menor costo de los últimos 90 días y su mayorista | Ninguna |
| Hay costo propio de más de 30 días | El costo propio. Al lado se muestra el menor precio web verificado hoy, para que el cotizador decida | "Costo antiguo" |
| No hay costo propio y la web entrega precio | El menor precio web verificado hoy entre dos fichas leídas en sitios habilitados | "Precio web" |
| No hay costo propio ni precio web | La línea queda sin costo y el cotizador lo ingresa | "Sin costo" |

Un precio web cuya ficha declara que no hay stock no se usa como costo. Cada precio verificado vale 24 horas: dentro de ese plazo no se vuelve a leer la ficha. El plazo de 30 días es configurable por categoría.

### Cómo se calcula el precio de venta

- El margen se expresa sobre el precio de venta: margen = (precio de venta neto − costo neto) ÷ precio de venta neto.
- Precio de venta neto = costo neto ÷ (1 − margen). Con costo de $1.000 y margen de 20 %, el precio de venta neto es $1.250.
- Si la empresa define sus reglas como recargo sobre el costo, la pantalla de reglas acepta el recargo y lo convierte.
- El margen sale de la regla más específica que aplique, en este orden: cliente final y categoría, cliente final, categoría, margen general.
- El despacho se agrega como línea aparte, con la regla que la empresa defina por zona o por monto.
- Los precios unitarios netos se redondean al peso. El IVA del 19 % se calcula sobre el total neto y se redondea al peso. Los productos exentos de IVA llevan esa marca en el catálogo y quedan fuera de la base del impuesto.
- La cotización tiene una vigencia configurable, que se entrega en 15 días. Al cumplirse, pasa sola al estado "vencida".
- La cotización muestra por línea el margen en pesos y en porcentaje, visible solo dentro de la aplicación. El documento que recibe el cliente final no muestra costos, márgenes ni fuentes.

### Cómo se puntúa una oportunidad de Mercado Público

Primero los filtros que descartan: estado distinto de publicada, región fuera de las de despacho, monto fuera del mínimo y máximo que definió la empresa, palabra excluida, o primer llamado cuando la empresa no es empresa de menor tamaño ni proveedor local para ese proceso.

Después el puntaje, de 0 a 100 puntos. Es una suma aritmética y se muestra desglosada al usuario:

| Factor | Puntos máximos | Fórmula |
|---|---|---|
| Cobertura | 40 | 40 × (líneas solicitadas que calzan con el catálogo con confianza de 0,80 o más ÷ líneas solicitadas) |
| Margen | 25 | Margen alcanzable = (presupuesto neto publicado − costo propio total) ÷ presupuesto neto publicado. Puntos = 25 × (margen alcanzable ÷ margen objetivo de la empresa), con tope de 25 y mínimo de 0. Se calcula solo cuando la cobertura es de 100 %; con cobertura menor vale 0 puntos |
| Tamaño | 15 | 15 puntos si el monto está dentro del rango que la empresa definió como atractivo; 7 puntos si está fuera de ese rango pero dentro del mínimo y máximo |
| Plazo | 10 | 10 × (horas que faltan para el cierre ÷ horas que la empresa necesita para cotizar), con tope de 10 |
| Historial | 10 | 10 puntos si la empresa recibió al menos una orden de compra de ese organismo en los últimos 24 meses; 0 puntos si no |

El modelo de IA participa solo en emparejar productos y en redactar el motivo en una frase. El puntaje no lo decide el modelo.

### Modelo de datos

| Grupo | Tablas | Contenido |
|---|---|---|
| Empresa y acceso | empresas, usuarios, roles | Cada fila de todas las demás tablas lleva el identificador de la empresa dueña |
| Catálogo | productos, alias_producto, mayoristas | Producto normalizado con marca, modelo, unidad base, contenido, categoría, código de barras, código UNSPSC, marca de exento de IVA y vector de búsqueda. Un producto sin unidad base o sin contenido queda en estado "incompleto" y no participa en comparaciones de precio hasta que alguien lo completa |
| Precios | compras_historicas, observaciones_precio, politica_fuentes | Costo de cada compra; cada precio capturado con su evidencia, moneda original y vigencia; estado de cada sitio y su tiempo de espera |
| Cotizaciones | solicitudes, lineas_solicitud, candidatos_linea, cotizaciones, reglas_margen | Archivo original, líneas leídas, candidatos propuestos, cotización con versión, correlativo, totales y estado: borrador, enviada, ganada, perdida o vencida |
| Mercado Público | oportunidades, items_oportunidad, puntajes, perfil_busqueda, ordenes_propias, precios_adjudicados | Cada proceso leído, sus productos, su puntaje desglosado, el perfil de la empresa, las órdenes de compra que la empresa ha recibido y los precios de órdenes de compra del Estado |
| Operación | tareas, avisos, uso_ia, auditoria | Cola de trabajo, avisos enviados, tokens y costo por empresa y por día, y registro de quién hizo qué |

### Seguridad y datos personales

- **Aislamiento por empresa** con seguridad a nivel de fila: la base de datos misma impide que un usuario lea filas de otra empresa. Las tareas de servidor y de cola usan una credencial con permisos amplios; por eso cada tarea lleva el identificador de la empresa y una prueba automática revisa que ninguna consulta de servidor omita ese filtro.
- **Acceso** con correo y contraseña, recuperación de contraseña por correo y segundo factor de verificación obligatorio para administradores.
- **Archivos** subidos directo al almacenamiento con un enlace temporal de uso único. Las funciones de Vercel aceptan un máximo de 4,5 MB por solicitud ([Vercel](https://vercel.com/docs/functions/limitations)) y las bases de licitación lo superan.
- **Secretos** fuera del código. El ticket de ChileCompra se guarda cifrado. La API de licitaciones y órdenes de compra lleva el ticket en la dirección de la consulta: los registros del sistema omiten esas direcciones.
- **Respaldos** diarios con retención de 7 días (Supabase Pro). La restauración se prueba una vez antes de salir a producción y queda documentada.
- **Monitoreo.** Toda tarea que falla tres veces genera un correo a Perrot Tech con su causa. La zona horaria del sistema es la de Santiago y los días hábiles siguen el calendario de feriados de Chile.
- **Los servicios de IA no entrenan con los datos enviados por API** en sus planes de pago ([Anthropic](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training), [OpenAI](https://developers.openai.com/api/docs/guides/your-data)). El nivel gratuito de Google Gemini sí usa los datos para mejorar sus productos ([Google](https://ai.google.dev/gemini-api/terms)): queda prohibido en este proyecto.
- **El conector es un flujo de datos aparte.** Lo que un usuario consulta por el conector pasa a su cuenta de Claude o de ChatGPT, bajo las condiciones de esa cuenta. El administrador de la empresa decide qué usuarios lo tienen habilitado.
- **Ley 21.719 de protección de datos personales: rige desde el 1 de diciembre de 2026.** Las cotizaciones contienen nombres y correos de personas. La empresa es la responsable de esos datos y Perrot Tech es el encargado. El artículo 15 bis exige un contrato que fije objeto, duración, finalidad, tipo de datos, categorías de titulares y derechos y obligaciones de las partes; exige autorización escrita para cada subencargado; y exige que al terminar el servicio los datos sean suprimidos o devueltos ([Ley 21.719](https://www.bcn.cl/leychile/navegar?idNorma=1209272)). El contrato nombra como subencargados a Vercel, Supabase, Anthropic, OpenAI, Google, Voyage, SerpApi, Firecrawl, Resend y GitHub. Al terminar el servicio, Perrot Tech entrega a la empresa una exportación completa de sus datos y los elimina de todos los sistemas dentro de 30 días.

### Capacidad, volumen y límites

**Capacidad de diseño**

| Medida | Valor |
|---|---|
| Cotizaciones | 400 al mes = 12.000 líneas al mes |
| Búsquedas de precio en la web | 6.000 al mes: el sistema se dimensiona para que la mitad de las líneas necesite búsqueda web |
| Fichas de producto leídas | 12.000 al mes: 2 fichas por cada búsqueda |
| Compras Ágiles leídas | 3.500 por día hábil = 77.000 al mes |
| Licitaciones leídas | 450 por día hábil = 9.900 al mes |
| Oportunidades que pasan el filtro y se puntúan | 525 Compras Ágiles y 68 licitaciones por día hábil |
| Consultas diarias a la API de Compra Ágil | 735: 210 de listado y 525 de detalle = 36,8 % del tope propio de 2.000 consultas al día |
| Consultas diarias a la API de licitaciones y órdenes de compra | 651 = 6,5 % del límite de 10.000 consultas diarias por ticket |
| Tamaño inicial de la base de datos | 285 MB: vectores de un catálogo de 50.000 productos y carga de 24 meses de historial |
| Crecimiento de la base de datos | 315 MB al mes, índices incluidos |
| Tamaño de la base a los 12 meses | 4,0 GB, de los 8 GB que incluye Supabase Pro. El disco incluido alcanza para 25 meses |

A los 12 meses, el detalle de las oportunidades cerradas que la empresa no cotizó se archiva fuera de la base principal. Los vectores de búsqueda se guardan solo para el catálogo: los títulos de las oportunidades se comparan al momento y no se almacenan como vectores, porque guardarlos sumaría 339 MB cada mes sin beneficio.

**Tiempos de respuesta exigidos**

| Operación | Exigencia |
|---|---|
| Cotización de 30 líneas con calce y costo propuesto en todas sus líneas | 3 minutos o menos en 95 de cada 100 casos, con hasta 5 cotizaciones en proceso a la vez |
| Verificación de fichas en sitios que piden espera entre consultas | Sigue en segundo plano; la línea muestra "verificando" y se completa en 15 minutos o menos |
| Búsqueda de un producto en el catálogo | 0,5 segundos o menos en 95 de cada 100 casos |
| Oportunidad de Compra Ágil visible en el panel | 45 minutos o menos desde su publicación en 95 de cada 100 casos |
| Resumen diario | Sale del sistema entre las 08:00 y las 08:05 |

**Límites que el sistema impone y comunica al usuario**

| Límite | Valor | Qué pasa al superarlo |
|---|---|---|
| Líneas por solicitud | 500 líneas | El sistema pide dividir el archivo |
| Tamaño de archivo | 20 MB | Rechazo con mensaje claro |
| Cotizaciones en proceso al mismo tiempo | 20 cotizaciones | Las siguientes esperan en cola y el usuario ve su posición |
| Consumo de los modelos de IA | La cola usa como máximo el 60 % del límite por minuto del servicio: 1.000 solicitudes y 2.000.000 de tokens de entrada por minuto en el primer nivel de Anthropic | Las tareas esperan su turno; ninguna se pierde |
| Gasto diario en IA por empresa | Tope configurable, que se entrega en USD 15 al día | Aviso al administrador al llegar a USD 12; al llegar al tope, las tareas no urgentes esperan al día siguiente |
| Consultas a la API de Compra Ágil | 2.000 consultas al día | El barrido baja su frecuencia; ante un error 429 espera el tiempo que indica ChileCompra |
| Avisos de urgencia | 5 por usuario y por día | Los siguientes se acumulan en el resumen diario |

El tope de gasto del primer nivel de la API de Anthropic es de USD 500 al mes por cuenta ([Anthropic](https://platform.claude.com/docs/en/api/rate-limits)). El gasto de IA de las dos etapas a capacidad de diseño es de USD 155,95 al mes: el tope cubre 3,2 veces ese gasto.

**Prueba de carga obligatoria antes de producción:** 5 veces la capacidad de diseño (2.000 cotizaciones y 60.000 líneas en un mes simulado, con 20 cotizaciones de 100 líneas entrando al mismo tiempo), sin pérdida de tareas y con cada límite respondiendo con el comportamiento definido para él. La prueba corre con respuestas simuladas de los modelos y de la búsqueda, para medir el sistema propio sin pagar consumo; se suma una corrida real con el volumen de un día.

---

## 7. Etapas de construcción

Cada subetapa se entrega como especificación propia, se aprueba, se construye en su rama (una copia de trabajo separada del código) y se cierra con contraprueba: perfiles diversos, carga alta, valores límite y entradas dañadas. Ninguna empieza sin que estén aprobadas las subetapas de las que depende.

### E0 — Levantamiento · 1 semana

**Objetivo.** Tener en la mano los datos reales de la empresa y las reglas del negocio antes de escribir código.

| # | Entregable | Uso en el proyecto |
|---|---|---|
| 1 | Sistema donde vive el historial (facturación, ERP o planillas) y la forma de conectarse a él | Define el conector que carga el catálogo y los costos |
| 2 | Muestra exportada de facturas de compra y cotizaciones emitidas | Permite analizar la estructura de los datos; la carga completa de 24 meses la hace el conector |
| 3 | Lista de mayoristas habituales, indicando en cuáles la empresa tiene cuenta y ejecutivo | Define a quién se pide acceso de integración |
| 4 | Reglas de margen por categoría y por cliente final, y si la empresa las expresa como margen o como recargo | Cálculo del precio de venta |
| 5 | Formato actual de cotización: logo, condiciones comerciales, vigencia, numeración, regla de despacho | Documento que recibe el cliente final |
| 6 | Usuarios y roles | Acceso al sistema |
| 7 | 20 solicitudes reales en sus formatos originales, con 300 líneas en total, y para cada línea el producto, la cantidad y la unidad correctos marcados por la empresa | Es la vara con que se mide la lectura y el emparejamiento. 200 líneas se usan para ajustar y 100 se reservan solo para medir |
| 8 | Línea base: minutos por cotización, cronometrados durante la semana; cotizaciones emitidas al mes y porcentaje ganado, tomados del historial | Es contra lo que se demuestra el resultado |
| 9 | Tamaño de la empresa según ventas anuales, rubros inscritos en Mercado Público, regiones de despacho y código de proveedor | Define qué oportunidades toma y si accede al primer llamado |
| 10 | Solicitud del ticket de las API de ChileCompra, hecha por una persona de la empresa con su Clave Única | Lectura de Mercado Público |
| 11 | Borrador del contrato de encargo de tratamiento de datos, con la lista de subencargados | Ley 21.719. Se firma antes de cargar datos reales |
| 12 | Solicitud de acceso de integración enviada a cada mayorista con cuenta | Precios de mayoristas con sesión |

**Se da por cerrada cuando** los entregables 1 a 9 están recibidos, la muestra del historial se abre y se lee sin errores, y las solicitudes 10 a 12 están enviadas. La subetapa E1.2 no carga datos reales hasta que el contrato esté firmado.

### Etapa 1 — Buscador y cotizador · 8 semanas de trabajo

#### E1.1 Fundaciones · 1 semana

**Alcance.** Repositorio, ambiente de prueba y ambiente de producción, ingreso de usuarios con roles, estructura multiempresa con aislamiento por fila, cola de tareas, registro de auditoría, registro de uso y costo de IA, capa de modelos con servicio de respaldo.

**Criterios de aceptación**
- Un usuario de la empresa A no logra leer ni modificar un dato de la empresa B por ninguna pantalla ni por llamada directa a la API.
- Con el servicio principal de IA apagado a propósito, una tarea de prueba se completa con el servicio de respaldo y queda registrado el cambio.
- Cada llamada a un modelo queda registrada con empresa, tarea, tokens y costo en dólares.
- Una tarea que falla se reintenta 3 veces con espera creciente y, si sigue fallando, queda visible como fallida con su causa y genera el correo de monitoreo.

**Contraprueba.** Sesión vencida, usuario sin rol, dos empresas con usuarios del mismo correo, 1.000 tareas encoladas a la vez, los dos servicios de IA apagados.

**Demostrable.** Ingreso con los 3 roles y panel de uso de IA con datos de prueba.

#### E1.2 Catálogo e historial · 2 semanas

**Alcance.** Conector al sistema de origen definido en E0, carga de los 24 meses, normalización de productos, unificación de duplicados, cálculo de vectores, buscador de catálogo, ficha de producto con su historial de costos y ventas.

**Criterios de aceptación**
- El 100 % de las facturas de compra del período queda cargado; el total neto por mes en el sistema coincide con el total del sistema de origen.
- Cada producto queda con unidad base y contenido, o en estado "incompleto". Una caja de 12 y la unidad suelta del mismo producto quedan como un solo producto con dos presentaciones.
- Al buscar cada uno de 100 productos del catálogo por su nombre escrito con un error de tipeo, el producto aparece entre los 3 primeros resultados en 95 de los 100 casos.
- La actualización diaria trae las facturas nuevas sin duplicar las existentes.

**Contraprueba.** Facturas con ítems sin código, descripciones con errores de tipeo, notas de crédito, archivos con columnas cambiadas de orden, carga repetida del mismo período.

**Demostrable.** La empresa busca cualquiera de sus productos y ve a cuánto lo compró, a quién y cuándo.

#### E1.3 Entrada de solicitudes · 1 semana

**Alcance.** Carga de Excel, PDF, imagen y texto pegado; lectura de líneas con producto, cantidad, unidad y marca; pantalla de revisión de lo leído.

**Criterios de aceptación**
- En las 100 líneas reservadas para medir, el sistema lee correctamente producto, cantidad y unidad en 97 de cada 100 líneas de archivos Excel y PDF digitales, y en 90 de cada 100 líneas de fotos o documentos escaneados.
- En Excel, el número de líneas leídas coincide con el número de filas con contenido. En PDF e imagen, el modelo declara cuántas líneas ve y el sistema avisa si esa cifra no coincide con las líneas extraídas.
- Una lista de útiles escolares escaneada de dos páginas se lee completa.

**Contraprueba.** Excel con celdas combinadas y varias hojas, PDF protegido, foto torcida y con poca luz, archivo vacío, archivo de 20 MB, 500 líneas, 501 líneas, texto con instrucciones escritas para engañar al modelo.

**Demostrable.** La empresa sube una solicitud real y ve sus líneas ordenadas en pantalla.

#### E1.4 Emparejamiento y búsqueda de precios · 2 semanas

**Alcance.** Calce de cada línea con el catálogo, búsqueda web en sitios habilitados, lectura de 2 fichas por producto buscado, conversión a precio neto por unidad base, guardado de evidencia, política de fuentes con lectura de robots.txt y tiempos de espera, registro de alias con cada corrección.

**Primera tarea: prueba de cobertura.** Antes de construir el resto, se buscan en la web 200 líneas reales de la empresa y se mide en cuántas aparece el producto correcto con precio, por categoría. El resultado define qué categorías se cotizan con apoyo de la web y cuáles dependen solo del historial y de los mayoristas con cuenta. En la misma prueba se completan las fichas de la política de fuentes.

**Criterios de aceptación, medidos sobre las 100 líneas reservadas y con los alias desactivados**
- El producto propuesto en primer lugar es el correcto en 85 de cada 100 líneas, y el correcto está entre los 3 primeros en 95 de cada 100.
- Al menos 70 de cada 100 líneas quedan propuestas con confianza de 0,80 o más, y de ellas 95 de cada 100 son correctas.
- Cada precio web guardado tiene enlace, fecha, hora, comercio y la marca de neto o con IVA.
- El sistema no consulta ninguna dirección vedada por el robots.txt del sitio ni ningún sitio no habilitado. Se comprueba revisando el registro completo de consultas de la prueba.
- Un precio por caja se compara correctamente con un precio por unidad del mismo producto.

**Contraprueba.** Producto que no existe, producto descontinuado, marca pedida sin stock, dos productos casi iguales en distinta medida, sitio caído, sitio que responde con bloqueo, servicio de búsqueda caído, precio en cero, precio en dólares, precio con formato extraño.

**Demostrable.** Una solicitud real queda con cada línea calzada, con su costo y su evidencia, en 3 minutos o menos.

#### E1.5 Cotización · 1 semana

**Alcance.** Reglas de margen, cálculo de precios, despacho, marcas de atención por línea, edición, versiones, aprobación, documento PDF y Excel con numeración correlativa automática, envío por correo, vigencia, estados y registro de resultado, reporte de cotizaciones ganadas y perdidas.

**Criterios de aceptación**
- El total neto coincide al peso con la suma de sus líneas, y el total con IVA coincide con el total neto más el 19 % redondeado al peso.
- La regla de margen aplicada es siempre la más específica disponible.
- El documento del cliente final no contiene costos, márgenes, fuentes ni marcas internas.
- No existe forma de enviar una cotización sin que un usuario con rol de cotizador o administrador la apruebe.
- La numeración no se repite ni salta, aun con dos usuarios aprobando al mismo tiempo.

**Contraprueba.** Margen negativo, margen de 0 %, cantidad decimal, producto exento de IVA, cotización de 1 línea y de 500 líneas, dos usuarios editando la misma cotización, cliente final sin regla de margen, correo de destino inválido.

**Demostrable.** La empresa emite una cotización real completa, desde el archivo recibido hasta el PDF enviado.

#### E1.6 Conector y cierre de etapa · 1 semana

**Alcance.** Conector para Claude y ChatGPT con 5 funciones: buscar producto, consultar costo, crear borrador de cotización, listar cotizaciones y ver una cotización. Ingreso con la misma cuenta de la aplicación. Prueba de carga, prueba de restauración del respaldo, manual de uso y capacitación.

**Criterios de aceptación**
- Desde Claude, un usuario pide el costo de un producto y recibe la misma respuesta que en la aplicación.
- El conector no tiene ninguna función que apruebe o envíe.
- Un usuario con rol de lector no logra crear borradores por el conector.
- La prueba de carga de 5 veces la capacidad de diseño, con modelos y búsqueda simulados, termina sin tareas perdidas; la corrida real de un día de volumen cumple los tiempos exigidos.
- El respaldo de la base se restaura completo en un ambiente limpio y la aplicación funciona sobre él.

**Contraprueba.** Usuario sin permiso que intenta usar el conector, sesión del conector vencida, pedido por el conector que intenta aprobar o enviar, restauración sobre un respaldo de 7 días.

**Demostrable.** El sistema en producción, usado por el equipo de la empresa con solicitudes del día.

### Etapa 2 — Agente de oportunidades en Mercado Público · 5 semanas de trabajo

#### E2.1 Conexión con ChileCompra · 1 semana

**Alcance.** Lectura de la API de Compra Ágil cada 30 minutos, todos los días, usando el filtro de cambios recientes; lectura nocturna de licitaciones entre las 22:00 y las 07:00, horario que ChileCompra recomienda para consultas masivas; carga de las órdenes de compra que la empresa ha recibido, consultadas por su código de proveedor; guardado de cada proceso y de sus cambios de estado; manejo de errores y de límites.

**Lo que entrega cada fuente, según su documentación oficial**

| Fuente | Qué entrega | Límite |
|---|---|---|
| [API de Compra Ágil](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil.pdf), guía versión 3.0, presentada por ChileCompra como versión beta el 25 de mayo de 2026 | Listado por fecha de cambio, estado, región y palabra clave, con 50 procesos por página como máximo. Detalle con productos solicitados, cantidades, presupuesto, plazo de entrega y si es primer o segundo llamado. Las cotizaciones de los demás proveedores se muestran completas desde que el proceso pasa a estado cerrada | Cuota diaria por ticket; al superarla responde con error 429 y el tiempo de espera |
| [API de licitaciones](https://www.chilecompra.cl/wp-content/uploads/2026/03/Documentacion-API-Mercado-Publico-Licitaciones.pdf) | Listado por fecha y estado; detalle con ítems, código de producto UNSPSC, cantidades, fechas, monto que estima el organismo y organismo comprador | 10.000 consultas diarias por ticket |
| [API de órdenes de compra](https://www.chilecompra.cl/wp-content/uploads/2026/03/Documentacion-API-Mercado-Publico-oc.pdf) | Proveedor adjudicado, productos, cantidades y precio neto unitario; consulta por código de proveedor o de organismo | El mismo ticket y el mismo límite |
| [Datos Abiertos](https://datos-abiertos.chilecompra.cl/descargas/ordenes-y-licitaciones) | Archivos mensuales con todas las órdenes de compra y licitaciones, actualizados cada día con un día de desfase; archivo mensual de Compra Ágil del mes anterior | Sin ticket |

**Criterios de aceptación**
- Durante 5 días seguidos, el número de Compras Ágiles guardadas para cada día coincide con el total que informa la propia API para ese rango de fechas, y una muestra de 50 procesos elegidos al azar se encuentra en el buscador público de Mercado Público.
- Con la API caída durante 2 horas, el sistema recupera lo publicado en ese lapso al volver el servicio, sin duplicados.
- El ticket no aparece en ningún registro del sistema.
- El consumo diario se mantiene bajo las 2.000 consultas a la API de Compra Ágil y bajo el 20 % del límite de la API de licitaciones y órdenes de compra.

**Contraprueba.** Error 429, error 500, respuesta vacía, proceso que cambia de estado tres veces en un día, ticket bloqueado, campos que llegan vacíos.

**Demostrable.** Panel con todas las Compras Ágiles y licitaciones del día, con búsqueda por palabra.

#### E2.2 Perfil y puntaje · 2 semanas

**Alcance.** Perfil de búsqueda de la empresa (categorías, palabras incluidas y excluidas, regiones, monto mínimo y máximo, rango atractivo, margen objetivo, horas necesarias para cotizar), filtro previo, calce de productos contra el catálogo, cálculo del puntaje con su desglose, motivo en una frase. En la primera semana la empresa clasifica una muestra de 200 oportunidades reales como "me interesa" o "no me interesa".

**Criterios de aceptación, medidos sobre la muestra de 200 oportunidades ordenada por puntaje**
- Si la empresa marcó N oportunidades como interesantes, entre las N de mayor puntaje al menos 7 de cada 10 son de las marcadas como interesantes.
- Entre las 2 × N de mayor puntaje están al menos 9 de cada 10 de las marcadas como interesantes.
- El puntaje mostrado coincide con la suma de sus 5 factores.
- Una oportunidad en primer llamado no se muestra como disponible si la empresa no es empresa de menor tamaño ni proveedor local para ese proceso.

**Contraprueba.** Oportunidad sin productos detallados, con 80 productos, con presupuesto en cero, con descripción ambigua ("materiales varios"), con rubro mal elegido por el comprador, publicada y cancelada el mismo día.

**Demostrable.** Lista diaria ordenada por puntaje con el motivo de cada una.

#### E2.3 Avisos y paso a cotización · 1 semana

**Alcance.** Resumen diario por correo a las 08:00 de cada día hábil; aviso de urgencia; botón que convierte la oportunidad en cotización con productos, cantidades y costos cargados; registro de si se cotizó y de si se ganó; 4 funciones nuevas en el conector: listar las oportunidades del día, ver una oportunidad, ver su puntaje con el motivo, y crear el borrador de cotización desde una oportunidad.

**Regla del aviso de urgencia.** Se envía cuando una oportunidad de 75 puntos o más queda a menos de 24 horas de su cierre y ningún usuario de la empresa la ha abierto. Sale dentro de los 45 minutos siguientes al momento en que se cumple esa condición. Cada usuario recibe como máximo un aviso de urgencia por oportunidad y 5 al día. El resumen diario es un envío distinto y no cuenta como aviso de urgencia.

**Criterios de aceptación**
- El resumen sale del sistema entre las 08:00 y las 08:05 los 5 días hábiles de la semana de prueba.
- El aviso de urgencia sale dentro de los 45 minutos siguientes al momento en que la oportunidad cumple la condición.
- La cotización creada desde una oportunidad tiene las mismas líneas y cantidades que el proceso publicado.
- Cada usuario elige qué avisos recibe.

**Contraprueba.** Día feriado, oportunidad que cambia su fecha de cierre, oportunidad cancelada después del aviso, 30 oportunidades urgentes el mismo día, usuario sin correo válido.

**Demostrable.** La empresa recibe el resumen real del día y cotiza una oportunidad desde el botón.

#### E2.4 Inteligencia de precios y cierre · 1 semana

**Alcance.** Carga nocturna de los archivos de Datos Abiertos de ChileCompra, filtrada a las categorías UNSPSC del catálogo de la empresa; para cada producto del catálogo, historial de precios adjudicados en órdenes de compra del Estado; para cada Compra Ágil cerrada en que la empresa participó, los montos que cotizaron los demás proveedores; reporte mensual de oportunidades vistas, cotizadas y ganadas, margen obtenido y monto en órdenes de compra recibidas por organismo; una función nueva en el conector para consultar precios adjudicados; prueba de carga y cierre.

**Criterios de aceptación**
- Para 50 productos de alta rotación elegidos por la empresa, el sistema muestra los precios adjudicados de los últimos 12 meses con organismo, fecha y cantidad.
- El reporte mensual cuadra con las cotizaciones registradas en la aplicación.
- La prueba de carga con el doble del volumen diario de publicaciones termina dentro de los tiempos exigidos.

**Contraprueba.** Archivo mensual dañado, archivo de 150 MB, mes sin datos, producto sin código UNSPSC, orden de compra con precio en cero, carga repetida del mismo mes.

**Demostrable.** Al cotizar una Compra Ágil, el cotizador ve a cuánto se adjudicó ese producto las últimas veces.

---

## 8. Costo mensual de los servicios tecnológicos

Todas las cifras salen de un único archivo de cálculo. Precios leídos en la página oficial de cada servicio el 5 de octubre de 2026. No incluyen desarrollo, mantención ni honorarios de Perrot Tech.

### Costo mensual por componente

| Componente | Piloto: 100 cotizaciones al mes | Etapa 1 a capacidad de diseño: 400 cotizaciones al mes | Etapa 2: costo adicional a la etapa 1 |
|---|---|---|---|
| Vercel Pro, 1 usuario desarrollador | USD 20,00 | USD 20,00 | USD 0,00 |
| Supabase Pro | USD 25,00 | USD 25,00 | USD 0,00 |
| Búsqueda de precios (SerpApi) | USD 75,00 · plan Developer, hasta 5.000 búsquedas al mes | USD 150,00 · plan Production, hasta 15.000 búsquedas al mes | USD 0,00 |
| Lectura de fichas (Firecrawl) | USD 19,00 · plan Hobby, hasta 5.000 páginas al mes | USD 99,00 · plan Standard, hasta 100.000 páginas al mes | USD 0,00 |
| Correo (Resend) | USD 0,00 | USD 0,00 | USD 20,00 |
| Modelos de IA y vectores | USD 24,85 | USD 99,41 | USD 56,53 |
| **Total al mes en dólares** | **USD 163,85** | **USD 393,41** | **USD 76,53** |
| **Total al mes en pesos** | **$159.364** | **$382.635** | **$74.437** |
| Costo por cotización | $1.594 por cotización | $957 por cotización | No aplica |

**Las dos etapas juntas a capacidad de diseño: USD 469,95 al mes = $457.072 al mes.**

De ese total, USD 314,00 al mes ($305.396) son suscripciones que se pagan completas aunque no se emita ninguna cotización. Los USD 155,95 restantes ($151.676) son consumo de modelos de IA, que sube y baja con el uso.

### Qué pasa si cambian las condiciones

| Escenario | Costo al mes | Veces el costo a capacidad de diseño |
|---|---|---|
| Las dos etapas a capacidad de diseño | $457.072 | 1,00 |
| El uso se duplica (800 cotizaciones al mes y el doble de publicaciones) | $607.464 | 1,33 |
| Todos los servicios tecnológicos duplican sus tarifas | $914.144 | 2,00 |
| El dólar sube 15 % | $525.633 | 1,15 |
| Las tres cosas a la vez | $1.397.167 | 3,06 |
| El modelo extractor se reemplaza por uno del precio de Claude Sonnet 5.5 | $598.790 | 1,31 |
| El modelo extractor se reemplaza por Gemini 3.5 Flash-Lite | $368.237 | 0,81 |

Duplicar el uso sube el costo 32,9 % y no 100 %, porque los planes de búsqueda y de lectura de fichas contratados a capacidad de diseño ya cubren el doble de volumen.

### Lo que vale tener el motor intercambiable

Con el modelo extractor cambiado a Gemini 3.5 Flash-Lite (USD 0,30 por millón de tokens de entrada y USD 2,50 por millón de tokens de salida), el costo de IA de las dos etapas baja en USD 91,34 al mes. Si el extractor tuviera que reemplazarse por un modelo del precio de Claude Sonnet 5.5, sube en USD 145,71 al mes. El modelo se elige con las 100 líneas reservadas: se usa el más barato que cumpla los criterios de aceptación de la subetapa E1.4.

Dos hechos obligan a mantener el modelo como configuración. Anthropic compromete la disponibilidad de Claude Haiku 4.5 hasta el 15 de octubre de 2026 y no ha anunciado su fecha de retiro ([Anthropic](https://platform.claude.com/docs/en/about-claude/model-deprecations)). Google duplica el 1 de enero de 2027 el precio de sus modelos Gemini 3.6, 3.7 y 3.8 Flash ([Google](https://ai.google.dev/gemini-api/docs/pricing)).

---

## 9. Lo que juega en contra

| Riesgo | Qué significa | Qué hace el diseño |
|---|---|---|
| Los mayoristas de oficina no publican su lista de precios | Dimerc y Prisa solo muestran su lista a clientes con sesión iniciada. La búsqueda web no los cubre. | El historial propio es la fuente principal. En E0 se pide acceso de integración a cada mayorista con cuenta. |
| El precio de la web no es el precio que la empresa consigue | El precio público es de consumidor; la empresa compra con precio negociado, por volumen y con despacho distinto. | El precio web se usa solo cuando no hay costo propio, y la línea queda marcada como "precio web". |
| El emparejamiento se equivoca | El estudio de Peeters y Bizer muestra que un modelo de lenguaje no alcanza el 100 % al reconocer el mismo producto, ni con ejemplos. | Revisión humana obligatoria, confianza visible, alias que aprenden de cada corrección y medición con las 100 líneas reservadas. |
| Dependencia de un servicio de búsqueda en disputa | SerpApi obtiene sus datos leyendo Google. Google lo demandó en diciembre de 2025; un tribunal de Estados Unidos desestimó la demanda el 21 de julio de 2026 y Google presentó una versión corregida en agosto de 2026. El juicio sigue abierto ([Search Engine Roundtable](https://www.seroundtable.com/google-amends-lawsuit-against-serpapi-41860.html)). | La búsqueda está detrás de una interfaz propia y se reemplaza sin tocar el resto del sistema. |
| La API de Compra Ágil es una versión beta | No tiene compromiso de disponibilidad, no publica el número de su cuota diaria y no permite filtrar por producto ni por rubro: los productos solo vienen en el detalle de cada proceso. | Filtro previo por título y descripción, tope propio de 2.000 consultas al día, recuperación automática tras caídas. |
| ChileCompra tiene la facultad de cambiar o suspender el servicio | Sus condiciones dicen que la API es un servicio voluntario y modificable. Además, la plataforma completa migra a un sistema nuevo con implementación general en el primer semestre de 2027 ([ChileCompra, agosto de 2026](https://www.chilecompra.cl/2026/08/chilecompra-licita-el-diseno-del-plan-de-adopcion-para-la-nueva-plataforma-de-mercado-publico/)). | El conector a ChileCompra está aislado en un módulo: cada cambio de la API se resuelve cambiando ese módulo. |
| Las bases de las licitaciones no se obtienen por API | Ninguna API oficial entrega los PDF de bases y anexos. | El agente puntúa con los datos estructurados y entrega el enlace a la ficha. El análisis automático de bases queda fuera de este proyecto. |
| Primer llamado reservado | Si la empresa no es empresa de menor tamaño ni proveedor local, solo accede a los segundos llamados. | E0 establece la condición de la empresa y el filtro la aplica. |
| Ganar más exige más caja | Las municipalidades pagan en 43 días en promedio y el sector salud en 40 días ([Ex-Ante, 21 de agosto de 2026](https://www.ex-ante.cl/negocios/estado-incumple-pago-30-dias/)). | El reporte mensual muestra el monto en órdenes de compra recibidas por organismo, para que la empresa proyecte su caja. |
| Automatizar de más tiene sanción | ChileCompra bloqueó a un proveedor que envió 17.213 cotizaciones automáticas en Compra Ágil, con 85,5 % de sus órdenes canceladas ([ChileCompra, enero de 2024](https://www.chilecompra.cl/2024/01/el-historial-de-malas-practicas-que-termino-con-el-bloqueo-de-publictrail-en-plataforma-de-mercado-publico/)). | El agente solo lee. Cotizar lo hace una persona. |
| El equipo no lo adopta | El índice de madurez en IA de CORFO y la Cámara de Comercio de Santiago da 34 puntos de 100 a las pymes chilenas, y el comercio está entre los sectores con más rezago ([CCS, 4 de septiembre de 2026](https://www.ccs.cl/2026/09/04/chile-mide-primera-vez-madurez-ia-parte-34-100-puntos-oportunidad-escalamiento/)). | Desde la subetapa E1.2, cada subetapa termina con una demostración con datos de la empresa. La línea base de E0 permite mostrarle su propio antes y después. |
| Hay alternativas baratas para la etapa 2 | Existen al menos 7 productos de alertas, con planes desde $0 al mes. | La etapa 2 se apoya en el costo propio que deja la etapa 1. Si la empresa decidiera no construir la etapa 1 completa, la recomendación es contratar un servicio de alertas y no construir la etapa 2. |

---

## 10. Lo que no queda listo para producción

**Al cerrar la etapa 1**
- Un solo ambiente de producción en una región (São Paulo). No hay sitio de respaldo en otra región.
- Recuperación ante desastre limitada al respaldo diario: una falla grave deja sin recuperar hasta un día de trabajo. La recuperación al minuto cuesta USD 100 adicionales al mes en Supabase ([Supabase](https://supabase.com/pricing)) y queda fuera.
- El plan gratuito de correo admite 100 envíos al día.
- La cobertura de precios web por categoría es la que arroje la prueba de cobertura. Las categorías que dependan de mayoristas con cuenta quedan limitadas hasta que cada mayorista entregue su acceso.
- No hay aplicación móvil. La web funciona en el teléfono.
- No hay integración de vuelta al sistema de facturación: la cotización ganada se factura en el sistema de la empresa como hoy.

**Al cerrar la etapa 2**
- Sin lectura automática de bases de licitación.
- Sin avisos por WhatsApp: ese canal requiere verificar el negocio ante Meta y cobra cada mensaje iniciado por la empresa ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)).
- Sin Convenio Marco ni Trato Directo: las API de ChileCompra no los entregan.
- La continuidad depende de un ticket personal de ChileCompra. Si ChileCompra lo bloquea o la persona deja la empresa, el agente se detiene hasta tener un ticket nuevo.
- El tope de gasto del primer nivel de la API de Anthropic cubre 3,2 veces el gasto de IA a capacidad de diseño. Un crecimiento mayor exige subir de nivel en Anthropic.

---

## 11. Método de trabajo

1. **Una especificación por subetapa.** Antes de construir, cada subetapa se detalla en su propia especificación: pantallas, tablas, funciones, casos de prueba. Eduardo Perrot, que lleva la dirección y el producto en Perrot Tech, la aprueba.
2. **Construcción con agentes en ramas separadas.** Las subetapas que no dependen entre sí se construyen en paralelo: E1.2 y E1.3 avanzan a la vez, y E2.1 avanza en su propia rama desde que termina E1.1.
3. **Revisión por fase.** Cada entrega se revisa contra sus criterios de aceptación, uno por uno.
4. **Contraprueba en Claude antes de cerrar.** Perfiles diversos, carga alta, valores límite y entradas dañadas. Lo que falla vuelve a construcción.
5. **Demostración a la empresa** al final de cada subetapa, con sus propios datos desde E1.2.

**Dependencias y calendario**

| Subetapa | Duración | Necesita terminadas | Termina en la semana |
|---|---|---|---|
| E0 | 1 semana | Ninguna | 1 |
| E1.1 | 1 semana | E0 | 2 |
| E1.2 | 2 semanas | E1.1 | 4 |
| E1.3 | 1 semana | E1.1 | 3 |
| E1.4 | 2 semanas | E1.2 y E1.3 | 6 |
| E1.5 | 1 semana | E1.4 | 7 |
| E1.6 | 1 semana | E1.5 | 8 |
| E2.1 | 1 semana | E1.1 | 3 |
| E2.2 | 2 semanas | E1.4 y E2.1 | 8 |
| E2.3 | 1 semana | E1.6 y E2.2 | 9 |
| E2.4 | 1 semana | E2.3 | 10 |

La suma de las duraciones es de 14 semanas. Construyendo en paralelo, el proyecto completo termina en la semana 10.

---

## 12. Fuentes

**Compras públicas**
- ChileCompra, API de Mercado Público: https://www.chilecompra.cl/api/
- ChileCompra, guía de uso de la API de Compra Ágil, mayo de 2026: https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil.pdf
- ChileCompra, lanzamiento de la API de Compra Ágil, 25 de mayo de 2026: https://www.chilecompra.cl/2026/05/nueva-api-de-compra-agil-mejora-el-acceso-y-analisis-de-datos-de-compras-publicas/
- ChileCompra, documentación de la API de licitaciones: https://www.chilecompra.cl/wp-content/uploads/2026/03/Documentacion-API-Mercado-Publico-Licitaciones.pdf
- ChileCompra, documentación de la API de órdenes de compra: https://www.chilecompra.cl/wp-content/uploads/2026/03/Documentacion-API-Mercado-Publico-oc.pdf
- ChileCompra, Datos Abiertos: https://datos-abiertos.chilecompra.cl/descargas/ordenes-y-licitaciones · https://datos-abiertos.chilecompra.cl/descargas/procesos-ocds
- ChileCompra, cifras 2025: https://www.chilecompra.cl/2026/02/obras-publicas-y-salud-impulsan-dinamismo-de-las-compras-publicas-con-fuerte-retroceso-del-trato-directo/
- ChileCompra, transacciones de Compra Ágil, primer semestre de 2025: https://www.chilecompra.cl/wp-content/uploads/2026/01/Transacciones-CompraAgil-semestre1-2025.pdf
- ChileCompra, Directiva N.º 35 de Compra Ágil: https://www.chilecompra.cl/wp-content/uploads/2025/12/563BRes-Directiva35CompraAgil.pdf
- ChileCompra, condiciones de uso: https://www.chilecompra.cl/terminos-y-condiciones-de-uso/
- ChileCompra, llamado al buen uso de herramientas robotizadas: https://www.chilecompra.cl/2024/07/chilecompra-llama-a-proveedores-a-hacer-buen-uso-de-herramientas-robotizadas-para-ofertar-a-las-compras-del-estado/
- ChileCompra, bloqueo de PublicTrail: https://www.chilecompra.cl/2024/01/el-historial-de-malas-practicas-que-termino-con-el-bloqueo-de-publictrail-en-plataforma-de-mercado-publico/
- ChileCompra, nueva plataforma de Mercado Público: https://www.chilecompra.cl/2026/08/chilecompra-licita-el-diseno-del-plan-de-adopcion-para-la-nueva-plataforma-de-mercado-publico/
- ChileCompra, Cuenta Pública, julio de 2026: https://www.chilecompra.cl/2026/07/cuenta-publica-participativa-de-chilecompra-destaca-ahorros-por-us-381-millones-en-2025-y-presenta-nuevas-herramientas-con-inteligencia-artificial-para-2026/
- Ministerio de Hacienda, Compra Ágil, 16 de junio de 2025: https://www.hacienda.cl/subsecretaria/noticias/empresas-de-menor-tamano-vendieron-us-287-millones-mediante-nueva-compra-agil

**Normas**
- Ley 19.886 de Compras Públicas: https://www.bcn.cl/leychile/navegar?idNorma=213004
- Decreto 661 de 2024, Reglamento de Compras Públicas: https://www.bcn.cl/leychile/navegar?idNorma=1209290
- Ley 21.719 de protección de datos personales: https://www.bcn.cl/leychile/navegar?idNorma=1209272
- Ley 21.459 de delitos informáticos: https://www.bcn.cl/leychile/navegar?idNorma=1177743
- Ley 17.336 de propiedad intelectual: https://www.bcn.cl/leychile/navegar?idNorma=28933
- RFC 9309, protocolo de exclusión de robots: https://www.rfc-editor.org/rfc/rfc9309.html

**Mercado y evidencia**
- SERNAC, precios de útiles escolares 2026: https://www.sernac.cl/portal/604/w3-article-88088.html
- DIPRES, sobregasto en Convenio Marco: https://www.dipres.gob.cl/598/articles-366422_doc_pdf.pdf
- Harvard Business Review, The Short Life of Online Sales Leads: https://hbr.org/2011/03/the-short-life-of-online-sales-leads
- Peeters y Bizer, emparejamiento de productos con modelos de lenguaje: https://arxiv.org/abs/2305.03423
- CCS y CORFO, índice de madurez en IA: https://www.ccs.cl/2026/09/04/chile-mide-primera-vez-madurez-ia-parte-34-100-puntos-oportunidad-escalamiento/
- Ex-Ante, plazos de pago del Estado: https://www.ex-ante.cl/negocios/estado-incumple-pago-30-dias/
- Search Engine Roundtable, demanda de Google contra SerpApi: https://www.seroundtable.com/google-lawsuit-serpapi-dismissed-41731.html · https://www.seroundtable.com/google-amends-lawsuit-against-serpapi-41860.html
- Productos de alertas de Mercado Público: https://marko.cl/ · https://www.licitalab.cl/planes · https://vendify.cl/ · https://licitaia.cl/pricing · https://piam.cl/ · https://adjudicapro.cl/ · https://alertasmp.cl/
- Referentes de cotización: https://www.canals.ai/products/distributor-order-entry · https://www.proton.ai/order-and-quote-entry · https://wherex.com/portal-de-compras/ · https://cl.senegocia.com/cotizador/ · https://www.iconstruye.com/gestion-de-compras/cotizaciones/
- Condiciones de uso de Mercado Libre Chile: https://www.mercadolibre.cl/ayuda/terminos-y-condiciones-de-uso_991
- Condiciones de uso de Dimerc: https://www.dimerc.cl/terminos-condiciones
- Intcomex, servicios web para clientes: https://iws.intcomex.com/webServices/que-es-iws.html
- Ingram Micro, API para distribuidores: https://developer.ingrammicro.com/reseller

**Tecnología y precios**
- Anthropic, precios: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic, retiro de modelos: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Anthropic, límites de uso: https://platform.claude.com/docs/en/api/rate-limits
- Anthropic, uso de datos: https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training
- Anthropic, conectores personalizados: https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp
- OpenAI, uso de datos: https://developers.openai.com/api/docs/guides/your-data
- OpenAI, modo desarrollador: https://developers.openai.com/api/docs/guides/developer-mode
- Google Gemini, precios y condiciones: https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/terms
- Voyage AI, precios: https://docs.voyageai.com/docs/pricing
- Vercel, precios, uso comercial y límites: https://vercel.com/pricing · https://vercel.com/docs/limits/fair-use-guidelines · https://vercel.com/docs/functions/limitations
- Supabase, precios: https://supabase.com/pricing
- SerpApi, precios: https://serpapi.com/pricing
- Firecrawl, precios: https://www.firecrawl.dev/pricing
- Resend, precios: https://resend.com/pricing
- Meta, precios de WhatsApp Business: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Vercel AI SDK: https://ai-sdk.dev/docs/introduction
- Model Context Protocol, especificación: https://modelcontextprotocol.io/specification/versioning
- Servicio de Impuestos Internos, dólar observado, UTM y UF de 2026: https://www.sii.cl/valores_y_fechas/dolar/dolar2026.htm · https://www.sii.cl/valores_y_fechas/utm/utm2026.htm · https://www.sii.cl/valores_y_fechas/uf/uf2026.htm

---

## Anexo interno — Estado de los datos y lo que falta

Este anexo es solo para Perrot Tech. No va en ninguna versión para la empresa.

**Parámetros de diseño que son supuestos propios, no mediciones**

| Parámetro | Valor usado | Se reemplaza con |
|---|---|---|
| Cotizaciones al mes y líneas por cotización | 400 y 30 | La línea base de E0 |
| Fracción de líneas que necesita búsqueda web | 50 % | La prueba de cobertura de E1.4 |
| Tokens por línea, por ficha y por oportunidad | Los del archivo de cálculo | El registro de uso de IA de E1.1 |
| Fracción de publicaciones que pasa el filtro previo | 15 % | La primera semana de E2.2 |
| Compras Ágiles publicadas por día | 3.500 | El conteo real de E2.1. La cifra oficial es "más de 3.000"; ChileCompra publica el número de órdenes emitidas (787.211 en 2025), no el de procesos publicados, que es mayor |
| Tamaño de filas, historial inicial e índices en la base de datos | Los del archivo de cálculo | Medición en E1.2 y E2.1 |
| Usuarios de la empresa | 10 | El entregable 6 de E0 |
| Duración de cada subetapa | Las del plan | Propuesta; la ajusta Eduardo según la disponibilidad del equipo |

**Datos que no se pudieron verificar en la fuente**

- Número de la cuota diaria de la API de Compra Ágil y si acepta el mismo ticket que la API de licitaciones. La guía no lo dice.
- Nombres exactos de los campos de las tres API: se leyeron por extracción automática de los PDF oficiales. Confirmarlos contra el PDF antes de programar E2.1, en especial cómo vienen el valor neto y el impuesto del presupuesto de Compra Ágil, de los que depende el factor de margen.
- Precios de OpenAI: dos páginas oficiales muestran generaciones de modelos distintas (GPT-6 en developers.openai.com y GPT-5.6 en openai.com). Por eso el documento no cita precios de OpenAI y lo deja solo como respaldo. Confirmar en la consola al crear la cuenta.
- Las cifras de precios de Anthropic, Google, Voyage, SerpApi, Firecrawl, Vercel, Supabase y Resend fueron leídas por dos lectores automáticos independientes y coinciden. Revisarlas a ojo antes de comprometer un precio con la empresa.
- Consumo de cómputo en Vercel: el plan Pro incluye USD 20 de crédito de uso y cobra el exceso. El cálculo trata a Vercel como USD 20 fijos. Medir el consumo real en E1.6.
- La lectura de fichas con Firecrawl en formato estructurado cuesta 5 créditos por página en vez de 1. El cálculo usa 1 crédito porque la extracción la hace el modelo propio.
- Cobertura de Chile en servicios alternativos de búsqueda. DataForSEO cobra USD 2 por 1.000 búsquedas y bajaría ese componente de USD 150 a USD 12 al mes. Vale la pena probarlo en la prueba de cobertura.
- Condiciones de uso de Alvi, Paris, Winpy, Nacional y MyShop: se leyó su robots.txt y no sus condiciones completas. Tratamiento del IVA en Lápiz López, Nacional, PC Factory, Wei y Winpy: no lo declaran en la portada. Ambas cosas se resuelven al completar la política de fuentes en E1.4.
- La cláusula 12 de Mercado Libre y la frase de las condiciones de Dimerc se leyeron directamente en el sitio durante la investigación. La revisión externa no logró volver a abrirlas porque ambos sitios bloquean la lectura automática.
- Artículo 97 del Decreto 661: leído en BCN durante la investigación; la revisión externa no logró abrir BCN para confirmarlo por segunda vez.
- El estudio de Harvard Business Review se leyó en un resumen; el artículo completo está tras un muro de pago.
- Fallo íntegro de la Corte Suprema del 29 de julio de 2026 (Rol 38.680-2026), que confirmó el rechazo a la extracción masiva de sentencias del Poder Judicial. Trata de datos personales judiciales y no de precios, pero es el precedente chileno más reciente sobre extracción automatizada.
- Si la empresa califica como proveedor local para compradores de la Región Metropolitana.

**Decisiones que conviene pasar por un abogado**

- La política de fuentes web: el documento reporta lo que dicen las leyes y las condiciones de cada sitio; no es una opinión legal.
- El contrato de encargo de tratamiento de datos de la Ley 21.719.

**Decisiones comerciales que este documento no toma**

- Precio de venta a la empresa y margen de Perrot Tech. El costo mensual de servicios tecnológicos calculado aquí es el piso que debe cubrir la mensualidad.
- Contrato de mantención y su precio. El riesgo de cambios en las API de ChileCompra necesita ese contrato.
- Propiedad del código y de los datos. El diseño multiempresa supone que el código es de Perrot Tech y los datos son de la empresa.
- Horas de trabajo del equipo por subetapa.
- Nombre comercial del producto.
