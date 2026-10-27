# Prompts de trabajo para el equipo

## Antes de comenzar

- Una persona crea el repositorio en GitHub y sube el prototipo base.
- Cada integrante crea su propia rama y trabaja en un alcance acordado.
- Antes de editar, revisa `README.md` y prueba el proyecto localmente.
- No subas datos personales, claves, eventos inventados presentados como reales, ni edites los mismos archivos a la vez sin coordinarlo.
- Abre un Pull Request pequeño y explica cómo probar el cambio. Otra persona revisa antes de mezclarlo a `main`.

## Integrante 1 — Interfaz y accesibilidad

```text
Trabaja en el prototipo Nochecita de planes de Halloween en Bogotá. Tu alcance es mejorar la experiencia visual y la accesibilidad de la interfaz en index.html y styles.css, sin cambiar el comportamiento de src/app.js ni los eventos de src/data.js.

Primero prueba el sitio en escritorio y móvil. Después implementa una mejora concreta (por ejemplo, navegación por teclado, estados de foco, contraste o adaptación móvil). Conserva el estilo y los textos en español. No agregues dependencias, contenido de eventos ficticios como si fuera real, ni cambies el alcance del producto.

Comprueba que la página sigue funcionando a 375 px de ancho y en escritorio. Entrega un resumen de archivos cambiados, cómo probarlo y cualquier limitación. No hagas commit directamente a main; prepara una rama y un Pull Request.
```

## Integrante 2 — Backend y guardado de datos

```text
Trabaja en el prototipo Nochecita. Tu alcance es entender y probar el backend de aprendizaje en server.mjs, su API y el guardado en data/suggestions.json. Lee primero docs/backend-guia.md y coordina cualquier cambio a index.html o src/app.js.

Verifica GET y POST /api/suggestions, los campos obligatorios, la validación del precio, el enlace de fuente y la persistencia tras reiniciar el servidor. Corrige errores reproducibles con cambios pequeños, mantén la validación en servidor y el manejo seguro de texto ingresado por usuarios. No agregues dependencias ni funcionalidad no acordada.

Ejecuta npm test y entrega un resumen del recorrido del dato, los archivos que cambiaste y los pasos para probarlo. No hagas commit directamente a main; prepara una rama y un Pull Request.
```

## Integrante 3 — Datos y mapa

```text
Trabaja en el prototipo Nochecita. Tu alcance es verificar la integración del mapa y definir un proceso fiable para actualizar src/data.js, sin reemplazar los ejemplos ficticios por información no confirmada.

Comprueba el mapa, los marcadores, los filtros que afectan los marcadores y el comportamiento sin conexión al CDN. Documenta qué campos requiere cada evento y cómo registrar fuente y fecha de verificación. Solo añade eventos reales después de contrastar cada dato con una fuente pública vigente y dejar el enlace y la fecha; si no puedes verificarlos, conserva la etiqueta de demostración.

No añadas claves privadas ni recolectes datos personales. Entrega los resultados de la verificación, las limitaciones del mapa y cómo probarlo. No hagas commit directamente a main; prepara una rama y un Pull Request.
```

## Tarea común posterior — Publicación

Cuando los Pull Requests estén revisados, una persona configura GitHub Pages siguiendo `README.md`. Otra persona prueba el enlace publicado desde un celular y una tercera verifica que el aviso de datos de demostración sea visible. No presenten los datos ficticios como eventos confirmados.
