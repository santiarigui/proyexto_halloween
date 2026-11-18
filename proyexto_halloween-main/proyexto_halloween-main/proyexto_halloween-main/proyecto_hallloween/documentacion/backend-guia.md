# Backend Java de Nochecita

## Requisitos
- JDK 17 o superior.
- Maven 3.8 o superior.

## Ejecutar
Desde la carpeta raíz del proyecto:

```bash
cd backend
mvn test
mvn package
mvn exec:java
```

El servidor estará disponible en http://127.0.0.1:3000. Para cambiar el puerto, define la variable de entorno `PORT`.

No abras el HTML con Live Server: el backend Java sirve el frontend y la API desde el mismo origen.

## Recorrido de una sugerencia
1. El formulario de `frontend/index.html` es gestionado por `frontend/app.js`.
2. JavaScript envía `POST /api/suggestions` como JSON.
3. `ApiServer` recibe la solicitud.
4. `SuggestionValidator` comprueba los campos.
5. `SuggestionService` persiste el objeto en `data/suggestions.json`.
6. El backend responde HTTP 201.
7. La interfaz consulta `GET /api/suggestions` y muestra la sugerencia pendiente.

## Clases Java
- `Main.java`: punto de entrada y configuración de rutas.
- `ApiServer.java`: servidor HTTP, endpoints y archivos estáticos.
- `Suggestion.java`: modelo de datos.
- `SuggestionValidator.java`: validaciones de negocio.
- `SuggestionService.java`: lectura y escritura JSON.

## API
- `GET /api/suggestions`: devuelve `{ "suggestions": [...] }`.
- `POST /api/suggestions`: recibe y valida una sugerencia; devuelve HTTP 201 cuando se guarda.

El contrato JSON se conserva para que el frontend no necesite cambiar sus solicitudes.

## Persistencia y alcance
Las sugerencias se guardan en `data/suggestions.json`. Los favoritos continúan almacenándose en `localStorage` del navegador. Los eventos de `frontend/data.js` son datos demostrativos independientes.

Este proyecto es una demostración local sin autenticación ni moderación administrativa. No se debe exponer a internet sin controles adicionales.
