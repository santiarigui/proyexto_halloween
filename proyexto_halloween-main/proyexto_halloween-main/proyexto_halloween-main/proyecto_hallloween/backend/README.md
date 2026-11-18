# Backend Java de Nochecita

Este backend está hecho con Java básico y las herramientas que vienen incluidas en el JDK. No necesita Maven ni librerías externas.

## Requisito
- JDK 17 o superior.

## Ejecutar
Abre una terminal en VS Code y ejecuta:

```bash
cd backend
javac Main.java
java Main
```

Abre http://localhost:3000 en el navegador.

Para detener el servidor, presiona Ctrl + C en la terminal.

## ¿Qué hace?
- Muestra la página web que está en la carpeta frontend.
- Atiende GET /api/suggestions para consultar sugerencias.
- Atiende POST /api/suggestions para guardar sugerencias.
- Guarda las sugerencias en data/suggestions.txt.

## Clases y conceptos
Todo el backend está en Main.java. Allí se encuentra el método main, el servidor HTTP, el manejo de solicitudes y el almacenamiento sencillo de sugerencias.
