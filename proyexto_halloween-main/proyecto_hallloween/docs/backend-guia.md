# Backend en 5 minutos

## 1. Arranca el servidor

Desde la carpeta del proyecto:

```bash
npm start
```

Abre <http://localhost:3000>. No abras `index.html` directamente ni uses Live Server: el formulario necesita que la página y el backend estén bajo la misma dirección.

## 2. Añade un plan en la página

Pulsa **Sugerir un plan**, completa los campos y guarda. En la pantalla debe aparecer el mensaje de que quedó pendiente de revisión.

## 3. Sigue el dato

El recorrido del formulario es:

```text
Formulario en index.html
       ↓ fetch("/api/suggestions", POST)
Ruta y validaciones en server.mjs
       ↓ escribe JSON
data/suggestions.json
       ↓ fetch("/api/suggestions", GET)
La web muestra el plan pendiente
```

Puedes abrir `data/suggestions.json` en VS Code para ver el objeto guardado. `title` es el nombre, `locality` la localidad, `date` la fecha ISO (`AAAA-MM-DD`), `time` la hora de 24 horas (`HH:MM`), `price` el costo en pesos, y `sourceUrl` el enlace que el equipo debe revisar.

## 4. Reinicia y comprueba que persiste

Detén el proceso con `Ctrl+C`, vuelve a ejecutar `npm start` y recarga la página. El plan debe seguir apareciendo porque está guardado en el archivo del servidor, no en el almacenamiento del navegador.

## 5. Qué revisar antes de darlo por bueno

- Un plan sugerido siempre se muestra como pendiente, nunca como confirmado.
- Entra un enlace `http`/`https`, una localidad admitida, categoría, fecha/hora válidas y precio entero.
- El servidor pone un límite al tamaño del cuerpo y a la cantidad de registros.
- Las sugerencias contienen texto público del usuario: el frontend lo escapa antes de mostrarlo.
- Es un ejemplo local sin autenticación. No lo expongas a internet ni guardes nombres, correos, teléfonos u otros datos personales.

El backend usa el módulo `node:http` y el sistema de archivos de Node; no hace falta instalar Express ni una base de datos para aprender este flujo.
