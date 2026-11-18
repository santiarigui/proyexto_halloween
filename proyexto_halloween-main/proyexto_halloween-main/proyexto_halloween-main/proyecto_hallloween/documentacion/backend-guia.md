# Backend Java de Nochecita

## Requisito
- Java JDK 17 o superior.
- No requiere Maven ni dependencias externas.

## Ejecutar
Desde la raíz del proyecto:

```bash
cd backend
javac Main.java
java Main
```

Abre http://localhost:3000. No uses Live Server porque Java sirve la página y la API desde el mismo servidor.

Para detenerlo, presiona Ctrl + C.

## Funcionamiento
1. El usuario consulta la página HTML.
2. El frontend usa JavaScript para enviar y consultar sugerencias.
3. La clase Main recibe las solicitudes HTTP.
4. Java guarda las sugerencias en data/suggestions.txt.

## Rutas
- GET /api/suggestions: consulta las sugerencias.
- POST /api/suggestions: guarda una sugerencia.

## Archivos principales
- backend/Main.java: servidor y lógica básica del backend.
- frontend/: página web, estilos y JavaScript.
- data/suggestions.txt: almacenamiento de sugerencias.
