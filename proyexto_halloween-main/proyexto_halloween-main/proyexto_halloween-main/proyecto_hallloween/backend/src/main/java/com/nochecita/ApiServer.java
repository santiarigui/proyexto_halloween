package com.nochecita;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.Executors;

/** Servidor HTTP: API de sugerencias y entrega de los archivos del frontend. */
public class ApiServer {
    private static final int MAX_REQUEST_BYTES = 16 * 1024;
    private final HttpServer server;
    private final SuggestionService suggestionService;
    private final Path frontendDirectory;
    private final ObjectMapper mapper = new ObjectMapper();

    public ApiServer(int port, Path frontendDirectory, SuggestionService suggestionService) throws IOException {
        this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        this.frontendDirectory = frontendDirectory.toAbsolutePath().normalize();
        this.suggestionService = suggestionService;
        server.createContext("/", this::handleRequest);
        server.setExecutor(Executors.newFixedThreadPool(
                Math.max(4, Runtime.getRuntime().availableProcessors())
        ));
    }

    public void start() {
        server.start();
    }

    public void stop(int delaySeconds) {
        server.stop(delaySeconds);
    }

    private void handleRequest(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if ("/api/suggestions".equals(path)) {
            handleSuggestions(exchange, method);
            return;
        }

        if (!"GET".equals(method) && !"HEAD".equals(method)) {
            exchange.getResponseHeaders().set("Allow", "GET, HEAD");
            sendJson(exchange, 405, Map.of("error", "Método no permitido."));
            return;
        }
        serveFrontend(exchange, path, "HEAD".equals(method));
    }

    private void handleSuggestions(HttpExchange exchange, String method) throws IOException {
        if ("GET".equals(method)) {
            try {
                sendJson(exchange, 200, Map.of("suggestions", suggestionService.findAll()));
            } catch (IOException exception) {
                exception.printStackTrace();
                sendJson(exchange, 500, Map.of("error", "No se pudieron leer las sugerencias guardadas."));
            }
            return;
        }

        if (!"POST".equals(method)) {
            exchange.getResponseHeaders().set("Allow", "GET, POST");
            sendJson(exchange, 405, Map.of("error", "Método no permitido."));
            return;
        }

        String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
        if (contentType == null || !contentType.toLowerCase().contains("application/json")) {
            sendJson(exchange, 415, Map.of("error", "Envía los datos como application/json."));
            return;
        }

        byte[] body = exchange.getRequestBody().readNBytes(MAX_REQUEST_BYTES + 1);
        if (body.length > MAX_REQUEST_BYTES) {
            sendJson(exchange, 413, Map.of("error", "La solicitud es demasiado grande."));
            return;
        }

        JsonNode input;
        try {
            input = mapper.readTree(new String(body, StandardCharsets.UTF_8));
        } catch (JsonProcessingException exception) {
            sendJson(exchange, 400, Map.of("error", "El cuerpo no contiene JSON válido."));
            return;
        }

        SuggestionValidator.ValidationResult validation = SuggestionValidator.validate(input);
        if (!validation.isValid()) {
            sendJson(exchange, 400, Map.of(
                    "error", "Revisa los datos del formulario.",
                    "details", validation.errors()
            ));
            return;
        }

        try {
            Suggestion saved = suggestionService.add(validation.suggestion());
            sendJson(exchange, 201, Map.of("suggestion", saved));
        } catch (SuggestionService.StorageLimitException exception) {
            sendJson(exchange, 507, Map.of("error", exception.getMessage()));
        } catch (IOException exception) {
            exception.printStackTrace();
            sendJson(exchange, 500, Map.of("error", "No se pudo guardar la sugerencia."));
        }
    }

    private void serveFrontend(HttpExchange exchange, String requestedPath, boolean headOnly) throws IOException {
        String relativePath = "/".equals(requestedPath) ? "index.html" : requestedPath.substring(1);
        Path file = frontendDirectory.resolve(relativePath).normalize();

        if (!file.startsWith(frontendDirectory)) {
            sendJson(exchange, 403, Map.of("error", "Ruta no permitida."));
            return;
        }
        if (Files.notExists(file) || !Files.isRegularFile(file)) {
            sendJson(exchange, 404, Map.of("error", "No se encontró el archivo."));
            return;
        }

        String contentType = contentType(file);
        byte[] content = headOnly ? new byte[0] : Files.readAllBytes(file);
        Headers headers = exchange.getResponseHeaders();
        headers.set("Content-Type", contentType);
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Cache-Control", "no-cache");
        exchange.sendResponseHeaders(200, headOnly ? -1 : content.length);
        if (!headOnly) {
            exchange.getResponseBody().write(content);
        }
        exchange.close();
    }

    private String contentType(Path file) {
        String name = file.getFileName().toString().toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (name.endsWith(".json")) return "application/json; charset=utf-8";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private void sendJson(HttpExchange exchange, int status, Object payload) throws IOException {
        byte[] response = mapper.writeValueAsBytes(payload);
        Headers headers = exchange.getResponseHeaders();
        headers.set("Content-Type", "application/json; charset=utf-8");
        headers.set("Cache-Control", "no-store");
        headers.set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.close();
    }
}
