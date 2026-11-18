package com.nochecita;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SuggestionValidatorTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void rejectsIncompleteSuggestion() throws Exception {
        var input = mapper.readTree("{\"title\":\"\",\"price\":-2}");
        var result = SuggestionValidator.validate(input);
        assertFalse(result.isValid());
        assertNull(result.suggestion());
        assertTrue(result.errors().size() >= 5);
    }

    @Test
    void acceptsValidSuggestionAndMarksItPending() throws Exception {
        String json = """
                {
                  "title":"Noche de disfraces",
                  "locality":"Suba",
                  "category":"familiar",
                  "audience":"familia",
                  "date":"2026-10-31",
                  "time":"19:30",
                  "place":"Parque de Suba",
                  "price":0,
                  "description":"Actividad familiar de Halloween",
                  "sourceUrl":"https://example.com/evento"
                }
                """;
        var result = SuggestionValidator.validate(mapper.readTree(json));
        assertTrue(result.isValid(), () -> result.errors().toString());
        assertEquals("pending", result.suggestion().status());
        assertEquals("Suba", result.suggestion().locality());
        assertNotNull(result.suggestion().id());
    }

    @Test
    void rejectsImpossibleDate() throws Exception {
        String json = """
                {
                  "title":"Evento",
                  "locality":"Suba",
                  "category":"familiar",
                  "audience":"familia",
                  "date":"2026-02-31",
                  "time":"19:30",
                  "place":"Parque",
                  "price":0,
                  "description":"Descripción",
                  "sourceUrl":"https://example.com"
                }
                """;
        var result = SuggestionValidator.validate(mapper.readTree(json));
        assertFalse(result.isValid());
        assertTrue(result.errors().contains("La fecha debe ser válida."));
    }
}
