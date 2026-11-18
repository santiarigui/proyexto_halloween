package com.nochecita;

import com.fasterxml.jackson.databind.JsonNode;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Centraliza las reglas de validación de las sugerencias comunitarias. */
public final class SuggestionValidator {
    private static final Set<String> LOCALITIES = Set.of(
            "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
            "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
            "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
            "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"
    );

    private static final Map<String, String> CATEGORIES = Map.of(
            "familiar", "Familiar",
            "cultura", "Cultura",
            "fiesta", "Fiesta",
            "aire-libre", "Al aire libre"
    );

    private static final Map<String, String> AUDIENCES = Map.of(
            "familia", "Para toda la familia",
            "adultos", "Jóvenes y adultos",
            "cualquiera", "Para todos los públicos"
    );

    private SuggestionValidator() { }

    public record ValidationResult(Suggestion suggestion, List<String> errors) {
        public boolean isValid() {
            return errors.isEmpty();
        }
    }

    public static ValidationResult validate(JsonNode input) {
        List<String> errors = new ArrayList<>();
        if (input == null || !input.isObject()) {
            return new ValidationResult(null, List.of("El cuerpo debe ser un objeto JSON."));
        }

        String title = readText(input, "title", "El nombre", 70, errors);
        String place = readText(input, "place", "El lugar", 100, errors);
        String description = readText(input, "description", "La descripción", 240, errors);

        String locality = readRawText(input, "locality");
        if (!LOCALITIES.contains(locality)) {
            errors.add("Selecciona una localidad válida de Bogotá.");
        }

        String category = readRawText(input, "category");
        if (!CATEGORIES.containsKey(category)) {
            errors.add("Selecciona un tipo de plan válido.");
        }

        String audience = readRawText(input, "audience");
        if (!AUDIENCES.containsKey(audience)) {
            errors.add("Selecciona un público recomendado válido.");
        }

        String date = readRawText(input, "date");
        try {
            if (!date.matches("\\d{4}-\\d{2}-\\d{2}")) {
                throw new DateTimeParseException("Formato inválido", date, 0);
            }
            LocalDate.parse(date);
        } catch (DateTimeParseException exception) {
            errors.add("La fecha debe ser válida.");
        }

        String time = readRawText(input, "time");
        try {
            if (!time.matches("\\d{2}:\\d{2}")) {
                throw new DateTimeParseException("Formato inválido", time, 0);
            }
            LocalTime.parse(time);
        } catch (DateTimeParseException exception) {
            errors.add("La hora debe tener formato HH:MM.");
        }

        String sourceUrl = readRawText(input, "sourceUrl");
        try {
            URI uri = URI.create(sourceUrl);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || scheme == null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new IllegalArgumentException("URL no permitida");
            }
            sourceUrl = uri.toASCIIString();
        } catch (IllegalArgumentException exception) {
            errors.add("Incluye una fuente con un enlace http o https válido.");
        }

        JsonNode priceNode = input.get("price");
        long price = -1;
        if (priceNode == null || !priceNode.isIntegralNumber() || !priceNode.canConvertToLong()) {
            errors.add("El precio debe ser un número entero en pesos colombianos.");
        } else {
            price = priceNode.longValue();
            if (price < 0 || price > 100_000_000L) {
                errors.add("El precio debe ser un número entero en pesos colombianos.");
            }
        }

        if (!errors.isEmpty()) {
            return new ValidationResult(null, List.copyOf(errors));
        }

        Suggestion suggestion = new Suggestion(
                UUID.randomUUID().toString(),
                title,
                locality,
                category,
                CATEGORIES.get(category),
                audience,
                AUDIENCES.get(audience),
                date,
                time,
                place,
                price,
                description,
                "Sugerencia comunitaria · pendiente de revisión",
                sourceUrl,
                "Pendiente de verificar",
                null,
                "✳",
                "pending",
                java.time.Instant.now().toString()
        );
        return new ValidationResult(suggestion, List.of());
    }

    private static String readText(JsonNode input, String key, String label, int maxLength, List<String> errors) {
        JsonNode value = input.get(key);
        if (value == null || !value.isTextual()) {
            errors.add(label + " debe ser texto.");
            return "";
        }
        String text = value.asText().trim();
        if (text.isEmpty() || text.length() > maxLength) {
            errors.add(label + " es obligatorio y debe tener máximo " + maxLength + " caracteres.");
        }
        return text;
    }

    private static String readRawText(JsonNode input, String key) {
        JsonNode value = input.get(key);
        return value != null && value.isTextual() ? value.asText().trim() : "";
    }
}
