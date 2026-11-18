package com.nochecita;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SuggestionServiceTest {
    @TempDir
    Path temporaryDirectory;

    @Test
    void createsJsonFileAndPersistsSuggestion() throws Exception {
        Path dataFile = temporaryDirectory.resolve("data").resolve("suggestions.json");
        SuggestionService service = new SuggestionService(dataFile);

        assertTrue(Files.exists(dataFile));
        assertEquals(0, service.findAll().size());

        Suggestion suggestion = new Suggestion(
                "test-id", "Plan de prueba", "Suba", "familiar", "Familiar",
                "familia", "Para toda la familia", "2026-10-31", "19:30",
                "Parque de Suba", 0L, "Descripción de prueba", "Pendiente",
                "https://example.com", "Pendiente de verificar", null, "✳",
                "pending", "2026-10-01T12:00:00Z"
        );

        service.add(suggestion);
        List<Suggestion> saved = service.findAll();

        assertEquals(1, saved.size());
        assertEquals("test-id", saved.get(0).id());
        assertEquals("Plan de prueba", saved.get(0).title());
        assertTrue(Files.readString(dataFile).contains("Plan de prueba"));
    }
}
