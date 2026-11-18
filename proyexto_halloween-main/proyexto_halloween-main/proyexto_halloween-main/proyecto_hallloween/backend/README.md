# Backend Java de Nochecita

El backend de Nochecita está implementado en Java 17 o superior. Utiliza el servidor HTTP incluido en el JDK y Jackson para leer y generar JSON.

## Requisitos

- JDK 17 o superior.
- Maven 3.8 o superior.

## Ejecutar desde esta carpeta

```bash
mvn test
mvn package
mvn exec:java -Dexec.mainClass="com.nochecita.Main"
```

Si no está configurado el plugin exec, también se puede ejecutar con:

```bash
mvn compile
java -cp "target/classes:target/dependency/*" com.nochecita.Main
```

El servidor escucha en http://127.0.0.1:3000 y entrega el frontend desde la carpeta hermana `../frontend`. Las sugerencias se guardan en `../data/suggestions.json`.

## API

- `GET /api/suggestions`: devuelve `{ "suggestions": [...] }`.
- `POST /api/suggestions`: valida y guarda una sugerencia; responde con HTTP 201.

El contrato JSON se conserva para que `frontend/app.js` no tenga que cambiar su lógica de comunicación.
