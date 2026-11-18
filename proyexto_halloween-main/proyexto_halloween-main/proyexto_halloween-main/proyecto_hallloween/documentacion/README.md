# Nochecita — Guía de planes de Halloween en Bogotá

Aplicación web académica para descubrir planes de Halloween en Bogotá mediante búsqueda, filtros, lista, mapa interactivo y favoritos. También permite enviar sugerencias comunitarias.

## Tecnologías
- HTML5 y CSS3: estructura y presentación.
- JavaScript: interacción del navegador, filtros, mapa y consumo de la API.
- Java 17: backend HTTP.
- Maven: compilación y dependencias.
- Jackson: serialización y lectura JSON.
- JSON: persistencia local de sugerencias.
- Leaflet y OpenStreetMap: mapa interactivo.

## Estructura
```text
proyecto_hallloween/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/nochecita/
│       │   ├── Main.java
│       │   ├── ApiServer.java
│       │   ├── Suggestion.java
│       │   ├── SuggestionValidator.java
│       │   └── SuggestionService.java
│       └── test/java/com/nochecita/
│           └── SuggestionValidatorTest.java
├── data/suggestions.json
├── documentacion/
│   ├── backend-guia.md
│   └── README.md
└── frontend/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── data.js
```

## Requisitos
JDK 17 o superior y Maven 3.8 o superior. Se necesita conexión a internet para cargar Google Fonts, Leaflet y los mosaicos de OpenStreetMap.

## Ejecutar
Desde la carpeta raíz:

```bash
cd backend
mvn test
mvn package
mvn exec:java
```

Abrir http://127.0.0.1:3000. No abrir `frontend/index.html` directamente ni usar Live Server: el servidor Java entrega la página y la API bajo el mismo origen.

## Funcionalidades
- Buscar eventos por nombre, zona o lugar.
- Filtrar por localidad, categoría, público y entrada gratuita.
- Alternar entre lista y mapa.
- Consultar detalles de los eventos.
- Guardar favoritos en `localStorage`.
- Enviar sugerencias comunitarias para revisión.

## Flujo del formulario
El navegador envía `POST /api/suggestions` con JSON. Java valida la información, genera un identificador, marca la sugerencia como `pending` y la guarda en `data/suggestions.json`. La consulta `GET /api/suggestions` permite recuperar los registros.

## Datos demostrativos
Los eventos de `frontend/data.js` son ejemplos visuales y no representan eventos confirmados o vigentes. Las sugerencias comunitarias se mantienen separadas y pendientes de revisión.

## Limitaciones
No hay autenticación, moderación remota ni base de datos externa. El servidor escucha en `127.0.0.1` y está pensado para uso académico local. No publicar como servicio abierto sin añadir seguridad, moderación y controles de abuso.
