import { randomUUID } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = projectDirectory;
const defaultDataFile = path.join(projectDirectory, "data", "suggestions.json");
const maxRequestBytes = 16 * 1024;
const maxSuggestionCount = 5000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

const localities = new Set([
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
  "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
  "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
  "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
]);
const categories = new Map([
  ["familiar", "Familiar"],
  ["cultura", "Cultura"],
  ["fiesta", "Fiesta"],
  ["aire-libre", "Al aire libre"],
]);
const audiences = new Map([
  ["familia", "Para toda la familia"],
  ["adultos", "Jóvenes y adultos"],
  ["cualquiera", "Para todos los públicos"],
]);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let receivedBytes = 0;
    let tooLarge = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (tooLarge) return;
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > maxRequestBytes) {
        tooLarge = true;
        reject(Object.assign(new Error("La solicitud es demasiado grande."), { status: 413 }));
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      if (!tooLarge) resolve(body);
    });
    request.on("error", reject);
  });
}

function validateSuggestion(input) {
  const errors = [];
  const text = (value, field, maxLength) => {
    if (typeof value !== "string") {
      errors.push(`${field} debe ser texto.`);
      return "";
    }
    const result = value.trim();
    if (!result || result.length > maxLength) errors.push(`${field} es obligatorio y debe tener máximo ${maxLength} caracteres.`);
    return result;
  };

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: ["El cuerpo debe ser un objeto JSON."] };
  }

  const title = text(input.title, "El nombre", 70);
  const place = text(input.place, "El lugar", 100);
  const description = text(input.description, "La descripción", 240);
  const locality = input.locality;
  if (!localities.has(locality)) errors.push("Selecciona una localidad válida de Bogotá.");

  const category = input.category;
  if (!categories.has(category)) errors.push("Selecciona un tipo de plan válido.");

  const audience = input.audience;
  if (!audiences.has(audience)) errors.push("Selecciona un público recomendado válido.");

  const date = input.date;
  const parsedDate = typeof date === "string" ? new Date(`${date}T12:00:00Z`) : null;
  if (
    typeof date !== "string"
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !parsedDate
    || Number.isNaN(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== date
  ) {
    errors.push("La fecha debe ser válida.");
  }

  const time = input.time;
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    errors.push("La hora debe tener formato HH:MM.");
  }

  let sourceUrl;
  try {
    const url = new URL(input.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protocolo no permitido");
    sourceUrl = url.href;
  } catch {
    errors.push("Incluye una fuente con un enlace http o https válido.");
  }

  const price = input.price;
  if (!Number.isSafeInteger(price) || price < 0 || price > 100_000_000) {
    errors.push("El precio debe ser un número entero en pesos colombianos.");
  }

  if (errors.length) return { errors };
  return {
    suggestion: {
      id: randomUUID(),
      title,
      locality,
      category,
      categoryLabel: categories.get(category),
      audience,
      audienceLabel: audiences.get(audience),
      date,
      time,
      place,
      price,
      description,
      sourceLabel: "Sugerencia comunitaria · pendiente de revisión",
      sourceUrl,
      verifiedAt: "Pendiente de verificar",
      coords: null,
      emoji: "✳",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  };
}

async function loadSuggestions(dataFile) {
  const content = await fs.readFile(dataFile, "utf8");
  const suggestions = JSON.parse(content);
  if (!Array.isArray(suggestions)) {
    throw new Error("data/suggestions.json debe contener una lista JSON.");
  }
  return suggestions;
}

async function writeSuggestions(dataFile, suggestions) {
  const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(suggestions, null, 2)}\n`, { flag: "wx" });
  await fs.rename(temporaryFile, dataFile);
}

let writeQueue = Promise.resolve();

function appendSuggestion(dataFile, suggestion) {
  const operation = writeQueue.then(async () => {
    const suggestions = await loadSuggestions(dataFile);
    if (suggestions.length >= maxSuggestionCount) {
      const error = new Error("Se alcanzó el límite de sugerencias de este prototipo.");
      error.status = 507;
      throw error;
    }
    suggestions.unshift(suggestion);
    await writeSuggestions(dataFile, suggestions);
    return suggestion;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function serveStaticFile(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: "La ruta no es válida." });
    return;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const absolutePath = path.resolve(publicDirectory, `.${requestedPath}`);
  if (!absolutePath.startsWith(`${publicDirectory}${path.sep}`)) {
    sendJson(response, 403, { error: "Ruta no permitida." });
    return;
  }

  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      sendJson(response, 404, { error: "No se encontró el archivo." });
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(absolutePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": stats.size,
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      createReadStream(absolutePath).pipe(response);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "No se encontró el archivo." });
      return;
    }
    throw error;
  }
}

export function createAppServer({ dataFile = defaultDataFile } = {}) {
  return createHttpServer(async (request, response) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const { pathname } = requestUrl;

    if (pathname === "/api/suggestions") {
      if (request.method === "GET") {
        try {
          const suggestions = await loadSuggestions(dataFile);
          sendJson(response, 200, { suggestions });
        } catch (error) {
          console.error("No se pudieron leer las sugerencias.", error);
          sendJson(response, 500, { error: "No se pudieron leer las sugerencias guardadas." });
        }
        return;
      }

      if (request.method === "POST") {
        if (!request.headers["content-type"]?.includes("application/json")) {
          sendJson(response, 415, { error: "Envía los datos como application/json." });
          return;
        }
        try {
          const body = await readRequestBody(request);
          let input;
          try {
            input = JSON.parse(body);
          } catch {
            sendJson(response, 400, { error: "El cuerpo no contiene JSON válido." });
            return;
          }
          const { errors, suggestion } = validateSuggestion(input);
          if (errors) {
            sendJson(response, 400, { error: "Revisa los datos del formulario.", details: errors });
            return;
          }
          const savedSuggestion = await appendSuggestion(dataFile, suggestion);
          sendJson(response, 201, { suggestion: savedSuggestion });
        } catch (error) {
          if (error.status) {
            sendJson(response, error.status, { error: error.message });
            return;
          }
          console.error("No se pudo guardar la sugerencia.", error);
          sendJson(response, 500, { error: "No se pudo guardar la sugerencia." });
        }
        return;
      }

      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "Método no permitido." });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      sendJson(response, 405, { error: "Método no permitido." });
      return;
    }

    try {
      await serveStaticFile(request, response, pathname);
    } catch (error) {
      console.error("No se pudo servir el archivo solicitado.", error);
      sendJson(response, 500, { error: "No se pudo servir la página." });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createAppServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Nochecita está funcionando en http://127.0.0.1:${port}`);
    console.log(`Las sugerencias se guardan en ${path.relative(projectDirectory, defaultDataFile)}`);
  });
}
