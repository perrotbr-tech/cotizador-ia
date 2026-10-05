# Guía de hoy — Cotizador IA

Orden de trabajo para dejar el MVP funcionando. Claude Code construye en la nube, conectado al repositorio. Codex revisa cada PR. Eduardo prueba en la vista previa de Vercel, aprueba y fusiona.

Mínimo para decir "funciona": pasos 1 a 5. Los pasos 6 y 7 completan el MVP.

---

## Preparación (la hace Eduardo)

**Antes del paso 1**

1. **GitHub.** Repositorio privado `cotizador-ia` en la cuenta `perrotbr-tech`, con el contenido de esta carpeta subido a `main`.
2. **Claude Code en la nube.** En claude.ai/code, conectar GitHub autorizando la app de Claude sobre ese repositorio.

**Mientras Claude Code construye el paso 1**

3. **Supabase.** Proyecto nuevo en la región São Paulo. Guardar la URL del proyecto y la clave pública.
4. **Vercel.** Importar el repositorio. Cargar las variables de `.env.example` en los entornos Production y Preview, con `BUSCADOR=simulado`.
5. **Usuario de prueba.** En Supabase, crear un usuario con correo y contraseña desde la sección de autenticación.

**Antes del paso 2**

6. **Anthropic.** Clave de API creada en la consola de Anthropic y cargada en Vercel como `ANTHROPIC_API_KEY`. Es una cuenta de API, distinta del plan Max, y se paga por consumo.

**Antes de probar el paso 3 con búsquedas reales**

7. **SerpApi.** Cuenta gratuita, clave cargada en Vercel como `SERPAPI_API_KEY`.
8. **Prueba de cobertura a mano.** En el probador de SerpApi, con el motor Google Shopping y país Chile, buscar 20 productos reales de la empresa: 5 de útiles, 5 de tecnología, 5 de alimentos y 5 de aseo. Anotar en cuántos aparece el producto correcto con precio. Un rubro con menos de 3 aciertos de 5 necesita otro buscador.

---

## Prompt maestro

Es el mismo para los 7 pasos. Solo cambia el número. Cada paso va en una sesión nueva.

```
Ejecuta el paso 1 de GUIA-DE-HOY.md.

Antes de empezar lee completos AGENTS.md, specs/SPEC-MVP.md y GUIA-DE-HOY.md. Sigue al pie de la letra el "Protocolo de cada paso" de AGENTS.md: muéstrame el plan en 10 líneas o menos y espera mi visto bueno; trabaja en una rama nueva desde main; construye solo el alcance de este paso; verifica con lint, typecheck, test y build; abre el PR con el informe de paso completo; y detente.
```

## Qué hace Eduardo con cada PR

1. Aplica en el editor SQL de Supabase el SQL que trae el informe, si lo hay.
2. Carga en Vercel las variables nuevas que pide el informe, si las hay.
3. Abre la vista previa de Vercel del PR y sigue los pasos de prueba del informe.
4. Pasa el PR a Codex con el prompt de revisión.
5. Lleva las correcciones a la misma sesión de Claude Code.
6. Fusiona. Recién entonces abre la sesión del paso siguiente.

---

## Paso 1 — Base

1. Proyecto Next.js con App Router y TypeScript estricto, con los comandos lint, typecheck, test y build.
2. Conexión a Supabase desde servidor y desde cliente usando la URL del proyecto y la clave pública, con ingreso por correo y contraseña y rutas protegidas.
3. Una migración SQL con todas las tablas de la sección "Datos" del spec, con seguridad a nivel de fila activada para usuarios con sesión.
4. En la misma migración, los datos iniciales: una empresa, su contador de correlativo, y las tiendas preferidas y excluidas que lista el spec, todas con IVA incluido. También el enlace automático de cada usuario nuevo con esa empresa.
5. `src/lib/calculo.ts` con las funciones de dinero del spec (precio publicado a costo neto, precio de venta desde costo y margen, total de línea, totales de cotización) y sus pruebas, incluidos los casos que pide la sección "Se da por terminado cuando".
6. Navegación con las pantallas Cotizaciones, Productos y Configuración. Configuración permite editar los datos de la empresa, el margen general, la vigencia en días, y el estado y el dato de IVA de cada tienda.
7. Configuración de Vercel con las funciones en la región São Paulo.
8. `README.md` con los pasos para aplicar la migración, crear el primer usuario y cargar las variables.

## Paso 2 — De la solicitud a las líneas

1. Pantalla "Nueva cotización": nombre del cliente final, caja de texto para pegar la solicitud y carga de archivo Excel o CSV.
2. Lectura del archivo en el servidor (todas las hojas del Excel) y extracción de líneas con el modelo definido en `MODELO_EXTRACTOR`, con salida estructurada validada con Zod: descripcion, cantidad, unidad, marca y texto_busqueda.
3. Las reglas de la sección "Lectura de la solicitud" y los límites de la sección "Límites" que aplican a este paso, validados en el servidor.
4. Pantalla "Cotización" con la tabla de líneas: se pueden editar descripción, cantidad, unidad y texto de búsqueda, agregar una línea y borrar una línea.
5. Registro de cada llamada al modelo en `uso_diario`.
6. El texto de la solicitud se trata como dato: el modelo no recibe herramientas y su respuesta se descarta si no cumple el esquema.
7. Pruebas automáticas con el modelo reemplazado por un doble: solicitud normal, solicitud vacía, respuesta que no cumple el esquema, y cada límite.

## Paso 3 — Buscador de precios

1. La interfaz `BuscadorPrecios` en `src/lib/buscador/` con dos implementaciones: SerpApi (motor `google_shopping`, `gl=cl`, `hl=es`, `google_domain=google.cl`) y simulada, que responde desde fixtures. La variable `BUSCADOR` elige cuál se usa.
2. El lector de la respuesta de SerpApi se construye sobre los campos de la documentación oficial del motor Google Shopping. Si falta un campo esperado en una respuesta real, el lector no se cae: registra qué campo faltó, sin datos sensibles, y sigue con los resultados que sí pudo leer.
3. Ruta de servidor que busca una línea: aplica los topes diario y mensual, el tiempo máximo de 20 segundos, guarda los candidatos y registra el uso. Un error del buscador deja la línea en estado "error" y no rompe nada más.
4. Botón "Buscar precios" en la cotización: el navegador pide las líneas de a 4 a la vez y muestra el avance línea por línea.
5. Clasificación de tiendas según la sección "Búsqueda de precios": preferidas primero, sin clasificar después con su marca, excluidas nunca. Una tienda nueva se crea como "sin clasificar".
6. Pantalla de candidatos de una línea: elegir uno, ingresar el costo a mano indicando si es neto o con IVA, y buscar de nuevo con otro texto.
7. Las marcas de atención del spec que dependen de la búsqueda.

**Después de fusionar el paso 3:** Eduardo cambia `BUSCADOR=serpapi` en Vercel y prueba una solicitud de 5 líneas. Cada línea gasta una búsqueda de las 250 del mes. Si los candidatos salen vacíos o con campos faltantes, copia el mensaje del registro y lo lleva a una sesión de corrección.

## Paso 4 — Cálculo y aprobación

1. Al elegir un candidato o ingresar un costo, la línea calcula costo neto, precio de venta y total usando únicamente `src/lib/calculo.ts`.
2. Margen general de la cotización tomado de la empresa, editable por cotización y por línea, dentro del rango del spec.
3. Totales de la cotización: neto, IVA y total.
4. Aprobar: no se permite con líneas sin costo; asigna el código correlativo con una función de la base de datos que bloquea el contador, de modo que dos aprobaciones simultáneas nunca repitan ni salten número; fija la vigencia.
5. Una cotización aprobada queda de solo lectura. Botón "Duplicar como borrador".
6. Lista de cotizaciones con código, cliente final, fecha, estado y total.
7. Prueba de dos aprobaciones simultáneas.

## Paso 5 — PDF y Excel

1. Descarga en PDF y en Excel desde la pantalla de la cotización, generados en el servidor.
2. Contenido exacto de la sección "Aprobación y documento": lo que lleva y lo que no lleva. Ningún costo, margen, tienda, enlace ni marca de atención sale en el documento.
3. Un borrador lleva la marca "BORRADOR" y no lleva código.
4. Formatos del `AGENTS.md` para dinero, porcentajes y fechas.
5. El PDF de una cotización de 200 líneas pagina bien: el encabezado de la tabla se repite en cada página, ninguna fila se corta por la mitad y los totales no quedan solos en una página.
6. Prueba automática: los totales del Excel coinciden con los calculados por `calculo.ts`.

## Paso 6 — Productos guardados

1. Al elegir un candidato, se crea o actualiza el producto y se guarda el precio observado con toda su evidencia.
2. Antes de buscar una línea, el sistema revisa los productos guardados según la regla del spec y, si hay un precio de 24 horas o menos, lo propone como primer candidato sin gastar una búsqueda. La línea lleva la marca "precio guardado".
3. Pantalla "Productos": lista con último precio, tienda y fecha, y buscador por nombre.

## Paso 7 — Contraprueba

1. No se agregan funciones.
2. Se revisan, uno por uno, los 9 puntos de la sección "Se da por terminado cuando" y todos los casos de la sección "Contraprueba de cierre". Cada caso que se pueda automatizar queda como prueba automática.
3. El informe trae una tabla con cada caso: qué se esperaba, qué pasó, y si pasa, falla o requiere prueba manual en la vista previa.
4. Cada falla se corrige en un commit propio.
5. El informe termina con la lista de lo que sigue sin estar listo para producción.

---

## Prompt de revisión para Codex (uno por cada PR)

```
Revisa este PR contra AGENTS.md y specs/SPEC-MVP.md. No reescribas código: reporta solo problemas, ordenados por gravedad, cada uno con archivo y línea.

Busca en este orden:
1. Reglas de AGENTS.md que el PR rompe.
2. Dinero: algún monto que no sea entero en pesos, o algún cálculo de precios fuera de src/lib/calculo.ts.
3. Claves o datos de servidor que lleguen al navegador o a los registros.
4. Límites del spec que no se validan en el servidor.
5. Errores sin manejar: buscador caído, respuesta vacía, respuesta del modelo que no cumple el esquema, tiempo agotado.
6. Consultas a la base de datos sin empresa_id.
7. Algo construido que el spec del MVP no pide.
8. Pruebas que faltan para lo que el paso exige.

Si no encuentras problemas en un punto, dilo en una línea.
```

---

## Si el día no alcanza

Con los pasos 1 a 5 fusionados y publicados, el flujo completo funciona: solicitud, líneas, precios, cotización aprobada y PDF. Los pasos 6 y 7 se hacen en la jornada siguiente, y el MVP no se muestra a la empresa antes del paso 7.
