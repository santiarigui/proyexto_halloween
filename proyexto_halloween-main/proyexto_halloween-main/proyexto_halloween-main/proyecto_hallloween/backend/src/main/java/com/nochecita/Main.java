package com.nochecita;

import java.nio.file.Path;

/** Punto de entrada del backend Java de Nochecita. */
public class Main {
    public static void main(String[] args) throws Exception {
        Path backendDirectory = Path.of("").toAbsolutePath().normalize();
        Path projectDirectory = backendDirectory.getFileName() != null
                && "backend".equals(backendDirectory.getFileName().toString())
                ? backendDirectory.getParent()
                : backendDirectory;

        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3000"));
        Path frontendDirectory = projectDirectory.resolve("frontend");
        Path dataFile = projectDirectory.resolve("data").resolve("suggestions.json");

        SuggestionService suggestionService = new SuggestionService(dataFile);
        ApiServer server = new ApiServer(port, frontendDirectory, suggestionService);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(1)));
        server.start();

        System.out.println("Nochecita Java está funcionando en http://127.0.0.1:" + port);
        System.out.println("Frontend: " + frontendDirectory);
        System.out.println("Sugerencias: " + dataFile);
    }
}
