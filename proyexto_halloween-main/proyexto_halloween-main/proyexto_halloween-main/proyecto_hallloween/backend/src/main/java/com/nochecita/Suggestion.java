package com.nochecita;

import java.util.List;

/**
 * Representa una sugerencia enviada desde el formulario de Nochecita.
 * Los nombres de sus propiedades coinciden con el contrato JSON del frontend.
 */
public record Suggestion(
        String id,
        String title,
        String locality,
        String category,
        String categoryLabel,
        String audience,
        String audienceLabel,
        String date,
        String time,
        String place,
        long price,
        String description,
        String sourceLabel,
        String sourceUrl,
        String verifiedAt,
        List<Double> coords,
        String emoji,
        String status,
        String createdAt
) { }
