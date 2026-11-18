import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/*
 * Backend sencillo de Nochecita.
 * Usa solamente Java (JDK): no necesita Maven ni librerias externas.
 */
public class Main {
    private static final List<String> sugerencias = new ArrayList<>();
    private static Path archivoDatos;
    private static Path carpetaFrontend;

    public static void main(String[] args) throws Exception {
        Path proyecto = Path.of("").toAbsolutePath().normalize();
        if (proyecto.getFileName() != null && proyecto.getFileName().toString().equals("backend")) {
            proyecto = proyecto.getParent();
        }

        carpetaFrontend = proyecto.resolve("frontend");
        Path carpetaDatos = proyecto.resolve("data");
        Files.createDirectories(carpetaDatos);
        archivoDatos = carpetaDatos.resolve("suggestions.txt");
        cargarSugerencias();

        int puerto = 3000;
        HttpServer servidor = HttpServer.create(new InetSocketAddress(puerto), 0);
        servidor.createContext("/", Main::atender);
        servidor.start();

        System.out.println("Nochecita esta funcionando en http://localhost:" + puerto);
        System.out.println("Presiona Ctrl + C para detener el servidor.");
    }

    private static void atender(HttpExchange intercambio) throws IOException {
        String ruta = intercambio.getRequestURI().getPath();
        String metodo = intercambio.getRequestMethod();

        if (ruta.equals("/api/suggestions")) {
            if (metodo.equals("GET")) {
                String respuesta = "{\"suggestions\":[" + String.join(",", sugerencias) + "]}";
                responder(intercambio, 200, respuesta, "application/json; charset=UTF-8");
            } else if (metodo.equals("POST")) {
                guardarSugerencia(intercambio);
            } else {
                responder(intercambio, 405, "{\"error\":\"Metodo no permitido\"}", "application/json");
            }
            return;
        }

        if (!metodo.equals("GET")) {
            responder(intercambio, 405, "Metodo no permitido", "text/plain");
            return;
        }

        String archivo = ruta.equals("/") ? "index.html" : ruta.substring(1);
        Path solicitado = carpetaFrontend.resolve(archivo).normalize();
        if (!solicitado.startsWith(carpetaFrontend) || !Files.isRegularFile(solicitado)) {
            responder(intercambio, 404, "No se encontro el archivo", "text/plain");
            return;
        }

        String tipo = "text/plain; charset=UTF-8";
        if (archivo.endsWith(".html")) tipo = "text/html; charset=UTF-8";
        if (archivo.endsWith(".css")) tipo = "text/css; charset=UTF-8";
        if (archivo.endsWith(".js")) tipo = "text/javascript; charset=UTF-8";
        if (archivo.endsWith(".svg")) tipo = "image/svg+xml";

        byte[] contenido = Files.readAllBytes(solicitado);
        intercambio.getResponseHeaders().set("Content-Type", tipo);
        intercambio.sendResponseHeaders(200, contenido.length);
        intercambio.getResponseBody().write(contenido);
        intercambio.close();
    }

    private static void guardarSugerencia(HttpExchange intercambio) throws IOException {
        String datos = new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

        if (!datos.startsWith("{") || !datos.endsWith("}") || !datos.contains("\"title\"")
                || !datos.contains("\"place\"") || !datos.contains("\"description\"")) {
            responder(intercambio, 400, "{\"error\":\"Completa los datos de la sugerencia\"}", "application/json");
            return;
        }

        String extra = ",\"id\":\"" + UUID.randomUUID()
                + "\",\"categoryLabel\":\"" + etiquetaCategoria(datos)
                + "\",\"audienceLabel\":\"" + etiquetaPublico(datos)
                + "\",\"sourceLabel\":\"Sugerencia comunitaria · pendiente de revision\""
                + ",\"verifiedAt\":\"Pendiente de verificar\",\"coords\":null,\"emoji\":\"✳\""
                + ",\"status\":\"pending\",\"createdAt\":\"" + Instant.now() + "\"";

        String sugerencia = datos.substring(0, datos.length() - 1) + extra + "}";
        sugerencias.add(0, sugerencia);
        Files.write(archivoDatos, sugerencias, StandardCharsets.UTF_8);

        responder(intercambio, 201, "{\"suggestion\":" + sugerencia + "}", "application/json; charset=UTF-8");
    }

    private static String etiquetaCategoria(String datos) {
        if (datos.contains("\"category\":\"familiar\"")) return "Familiar";
        if (datos.contains("\"category\":\"cultura\"")) return "Cultura";
        if (datos.contains("\"category\":\"fiesta\"")) return "Fiesta";
        return "Al aire libre";
    }

    private static String etiquetaPublico(String datos) {
        if (datos.contains("\"audience\":\"familia\"")) return "Para toda la familia";
        if (datos.contains("\"audience\":\"adultos\"")) return "Jovenes y adultos";
        return "Para todos los publicos";
    }

    private static void cargarSugerencias() throws IOException {
        if (Files.exists(archivoDatos)) {
            sugerencias.addAll(Files.readAllLines(archivoDatos, StandardCharsets.UTF_8));
        } else {
            Files.createFile(archivoDatos);
        }
    }

    private static void responder(HttpExchange intercambio, int estado, String texto, String tipo) throws IOException {
        byte[] contenido = texto.getBytes(StandardCharsets.UTF_8);
        intercambio.getResponseHeaders().set("Content-Type", tipo);
        intercambio.sendResponseHeaders(estado, contenido.length);
        intercambio.getResponseBody().write(contenido);
        intercambio.close();
    }
}
