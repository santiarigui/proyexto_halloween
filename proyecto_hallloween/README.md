# Nochecita — planes de Halloween en Bogotá

Prototipo académico de una guía móvil para explorar planes de Halloween por localidad, tipo de actividad y costo.

> **Aviso:** los eventos incluidos son datos ficticios de demostración. No son planes reales ni están confirmados. No asistir basándose en esta información.

## Probarlo localmente

Requiere Node.js 20 o superior. No usa paquetes externos de backend. Desde la carpeta del proyecto:

```bash
npm start
```

Abre <http://localhost:3000>. Para reiniciar el servidor automáticamente cuando guardes cambios en el backend, usa `npm run dev`. Para correr las pruebas: `npm test`.

El mapa usa Leaflet desde un CDN y teselas de OpenStreetMap, así que la vista de mapa requiere conexión a internet. Si no carga, la vista de lista sigue funcionando.
La tipografía personalizada también se carga desde Google Fonts; el diseño conserva fuentes de sistema como alternativa.

## Mini backend: ¿dónde pongo los datos?

Abre **Sugerir un plan** en la página y completa el formulario. La app envía esos campos a `POST /api/suggestions`; `server.mjs` los valida y los guarda en `data/suggestions.json`. La página lee esa lista mediante `GET /api/suggestions`. Cada envío queda marcado como pendiente de revisión.

| Campo en la página | Dato guardado |
| --- | --- |
| Nombre del plan | `title` |
| Localidad | `locality` |
| Tipo | `category` y `categoryLabel` |
| Fecha y hora | `date` y `time` |
| Público recomendado | `audience` y `audienceLabel` |
| Dirección o referencia | `place` |
| Enlace de la fuente | `sourceUrl` |
| Descripción | `description` |
| Gratis o precio | `price` (COP) |

Para introducir planes iniciales sin el formulario, edita `data/suggestions.json`: debe seguir siendo una lista JSON (`[]` si no hay planes). Al recargar la web, el backend devuelve los datos guardados. `src/data.js` contiene únicamente eventos ficticios de demostración.

Este backend es **local y educativo**: solo escucha en `127.0.0.1`, no tiene inicio de sesión ni moderación administrativa y cualquiera que pueda abrirlo en tu equipo podría enviar una sugerencia. No lo publiques directamente en internet ni guardes datos personales. GitHub Pages solo publica los archivos estáticos y no ejecuta `server.mjs`; para uso real harían falta un servidor desplegado, autenticación/moderación y una base de datos.

## Qué incluye el prototipo

- Diseño adaptable a móvil y escritorio.
- Búsqueda por nombre, zona y tipo de plan.
- Filtros de localidad, categoría, público y planes gratis.
- Vista de lista y mapa interactivo con ubicaciones aproximadas.
- Detalle de actividad con fecha, precio, lugar y estado de verificación.
- Guardados locales en el navegador.
- Backend Node.js local para validar, guardar y leer sugerencias compartidas en un archivo JSON.
- Formulario de sugerencias que las deja pendientes de revisión.
- Aviso explícito para diferenciar datos de demostración de eventos verificados.

## Estructura

```text
.
├── index.html          # Estructura y contenido de la página
├── styles.css          # Diseño adaptable y componentes visuales
├── server.mjs          # Backend Node.js: API y servidor estático
├── data/
│   └── suggestions.json # Planes sugeridos, guardados por el backend
├── src/
│   ├── app.js           # Filtros, mapa, diálogos y estado local
│   └── data.js          # Datos demostrativos de eventos
├── tests/
│   └── server.test.mjs  # Pruebas de API
└── docs/
    ├── backend-guia.md  # Recorrido simple de formulario a archivo JSON
    └── prompts-equipo.md # Tareas y prompts de colaboración para tres integrantes
```

## Cómo reemplazar los datos de muestra

Edita `demoEvents` en `src/data.js`. Para cada evento:

1. Confirma la actividad en una fuente pública y vigente.
2. Incluye nombre, fecha, hora, localidad, punto de referencia, costo y público recomendado.
3. Guarda el enlace de la fuente y la fecha en que alguien del equipo la verificó.
4. Usa coordenadas aproximadas del punto público, no la dirección privada de una persona.
5. No presentes una sugerencia de usuario como confirmada hasta que el equipo la revise.

Si un dato no está confirmado, déjalo fuera de la guía publicada o muéstralo claramente como pendiente. No inventes eventos, coordenadas ni enlaces.

## GitHub y publicación

1. Crea un repositorio vacío en GitHub (no agregues otro README para evitar conflictos).
2. Desde esta carpeta, añade el repositorio remoto y sube el proyecto:

   ```bash
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git add .
   git commit -m "Create Nochecita Halloween guide prototype"
   git push -u origin main
   ```

3. Usa el repositorio para colaborar con ramas y Pull Requests.

**Importante:** GitHub Pages puede mostrar la interfaz, pero no ejecuta `server.mjs`; por eso el formulario y la lectura de sugerencias no funcionarán allí. Para presentar el proyecto con el backend activo, ejecútalo localmente con `npm start`. Para publicarlo en internet, primero desplieguen frontend y backend en un servicio compatible y configuren una base de datos.

## Trabajo en equipo

Los prompts para repartir el trabajo inicial están en [`docs/prompts-equipo.md`](./docs/prompts-equipo.md). La guía para seguir los datos desde el formulario hasta el archivo se encuentra en [`docs/backend-guia.md`](./docs/backend-guia.md). Coordinen cambios en `server.mjs` y `data/suggestions.json` para evitar conflictos. Cada persona debe crear una rama y abrir un Pull Request; no trabajen todos directamente sobre `main`.

## Alcance y siguientes pasos

Este prototipo sí incluye un backend local de aprendizaje, pero no tiene inicio de sesión ni moderación remota. Para convertirlo en un servicio público, el equipo tendría que implementar y probar autenticación, revisión, protección contra abuso y una política de privacidad antes de aceptar contribuciones reales.
