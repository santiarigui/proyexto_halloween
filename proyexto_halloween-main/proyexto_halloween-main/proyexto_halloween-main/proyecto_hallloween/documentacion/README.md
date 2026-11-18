# Nochecita - Guía de planes de Halloween en Bogotá

Nochecita es una aplicación web académica para descubrir planes de Halloween en Bogotá mediante búsqueda, filtros por localidad, categoría y público, una vista de lista, un mapa interactivo y planes guardados en el navegador.

El proyecto también incluye un backend local desarrollado con Node.js para recibir, validar y persistir sugerencias enviadas por personas usuarias.

> **Nota de datos:** los eventos demostrativos son ejemplos de contenido y no representan planes confirmados ni vigentes. Deben mostrarse siempre como datos de muestra y no deben usarse para asistir a un evento.

## Inicio rápido

### Requisitos

- Node.js 20 o superior.
- Navegador moderno.
- Conexión a internet para cargar Leaflet, OpenStreetMap y Google Fonts.

### Ejecutar el proyecto

Desde la carpeta `proyecto_hallloween`:

```bash
npm install
npm start
```

Abre `http://127.0.0.1:3000`.

Para reiniciar el servidor automáticamente durante el desarrollo:

```bash
npm run dev
```

Para ejecutar las pruebas:

```bash
npm test
```

## ¿Qué hace la aplicación?

### Explorar planes

La portada presenta la propuesta visual de Halloween y permite desplazarse al catálogo.

### Buscar y filtrar

La interfaz permite buscar por nombre, zona o lugar y filtrar por:

- Localidad.
- Tipo de plan.
- Público recomendado.
- Entrada gratuita.
- Planes guardados por la persona usuaria.

### Cambiar entre lista y mapa

Los resultados pueden mostrarse como tarjetas o como marcadores sobre OpenStreetMap. Las coordenadas del catálogo son aproximadas y se usan únicamente para demostrar la ubicación visual.

### Consultar el detalle

Cada tarjeta abre un diálogo con descripción, fecha, hora, lugar, entrada, público y estado de la fuente.

### Guardar favoritos

Los identificadores de los planes se almacenan en `localStorage` del navegador. Los favoritos siguen disponibles después de recargar la página sin conexión con el backend.

### Sugerir un plan

El formulario recopila nombre, localidad, categoría, público, fecha, hora, lugar, enlace de fuente, descripción y precio.

Al enviar:

1. El frontend comprueba el enlace y el precio.
2. El navegador hace `POST /api/suggestions`.
3. El backend valida todos los campos.
4. El servidor crea un identificador único y guarda el plan como pendiente.
5. La aplicación actualiza el catálogo visible sin refrescar la página.

## Arquitectura del proyecto

```text
proyecto_hallloween/
├── index.html              # Estructura, formularios y diálogos
├── styles.css              # Diseño adaptable, componentes y estados visuales
├── server.mjs              # Servidor HTTP, API y archivos estáticos
├── data/
│   └── suggestions.json    # Sugerencias guardadas por el backend
├── src/
│   ├── app.js              # Estado, filtros, favoritos, mapa y formularios
│   └── data.js             # Catálogo demostrativo inicial
├── tests/
│   └── server.test.mjs     # Pruebas de API y persistencia
├── docs/
│   ├── backend-guia.md     # Recorrido explicado del backend
│   └── prompts-equipo.md   # Organización histórica del trabajo en equipo
├── package.json
└── README.md
```

## Catálogo demostrativo y backend

El catálogo inicial vive en `src/data.js`, dentro de `demoEvents`. Se integra en la interfaz mediante `allEvents()` y se muestra junto con las sugerencias recuperadas del backend.

Las sugerencias enviadas por el formulario viven en `data/suggestions.json` y pasan por `GET /api/suggestions` y `POST /api/suggestions`.

Esta separación es importante:

- `demoEvents`: ejemplos visibles para presentar el diseño.
- `suggestions.json`: datos enviados desde el formulario y marcados como pendientes.
- Ningún dato de demostración se debe presentar como evento confirmado.

No se recomienda duplicar manualmente los eventos demostrativos dentro de `suggestions.json`, porque podrían aparecer dos veces: primero como catálogo fijo y luego como sugerencia pendiente.

## API local

### Obtener sugerencias

```http
GET /api/suggestions
```

Respuesta:

```json
{
  "suggestions": []
}
```

### Crear una sugerencia

```http
POST /api/suggestions
Content-Type: application/json
```

Campos requeridos: `title`, `locality`, `category`, `audience`, `date`, `time`, `place`, `sourceUrl`, `description` y `price`.

Una creación válida responde con estado `201` y devuelve la sugerencia creada con estado `pending`.

## Validaciones implementadas

El servidor valida:

- Campos de texto obligatorios y sus límites.
- Localidad, categoría y público permitidos.
- Fecha real en formato `AAAA-MM-DD`.
- Hora en formato `HH:MM`.
- URL con protocolo `http` o `https`.
- Precio entero, no negativo y dentro del rango permitido.
- Tamaño máximo del cuerpo de la solicitud.
- Cantidad máxima de sugerencias almacenadas.

## Datos demostrativos

Para modificar `demoEvents` en `src/data.js`:

1. Mantener el aviso de datos de demostración.
2. Identificar el evento, localidad, categoría y público.
3. Registrar fecha, hora y lugar de referencia.
4. Incluir una fuente real antes de presentar cualquier dato como confirmado.
5. Usar coordenadas aproximadas de puntos públicos, nunca direcciones privadas.
6. No mostrar sugerencias comunitarias como verificadas sin revisión humana.

Los marcadores y ubicaciones aproximadas deben considerarse parte de la simulación académica.

## Pruebas actuales

La suite verifica:

- Carga de la página principal.
- Consulta de una lista vacía.
- Rechazo de datos incompletos.
- Guardado y recuperación de sugerencias.
- Rechazo de fechas imposibles.

Ejecuta `npm test` después de cualquier cambio en `server.mjs`, `data/suggestions.json` o la API.

## Limitaciones

Este proyecto corresponde a una entrega académica local. No incluye:

- Inicio de sesión.
- Moderación administrativa remota.
- Base de datos externa.
- Publicación segura en Internet.
- Verificación real de todos los eventos demostrativos.

El servidor solo escucha en `127.0.0.1`. GitHub Pages puede publicar los archivos estáticos, pero no ejecuta `server.mjs`, por lo que el formulario no funcionará en esa modalidad.

Para convertir el proyecto en un servicio público se necesitarían autenticación, moderación, protección contra abuso, una base de datos y una política de privacidad.
