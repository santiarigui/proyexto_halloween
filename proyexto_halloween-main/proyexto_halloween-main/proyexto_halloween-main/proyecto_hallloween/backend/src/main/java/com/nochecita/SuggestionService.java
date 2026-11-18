package com.nochecita;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

/** Lee y escribe las sugerencias en data/suggestions.json. */
public class SuggestionService {
    private static final int MAX_SUGGESTIONS = 5000;
    private final Path dataFile;
    private final ObjectMapper mapper;

    public SuggestionService(Path dataFile) throws IOException {
        this.dataFile = dataFile.toAbsolutePath().normalize();
        this.mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
        Files.createDirectories(this.dataFile.getParent());
        if (Files.notExists(this.dataFile)) {
            Files.writeString(this.dataFile, "[]\n");
        }
    }

    public synchronized List<Suggestion> findAll() throws IOException {
        if (Files.notExists(dataFile)) {
            return new ArrayList<>();
        }
        List<Suggestion> suggestions = mapper.readValue(
                dataFile.toFile(), new TypeReference<List<Suggestion>>() { }
        );
        return suggestions == null ? new ArrayList<>() : suggestions;
    }

    public synchronized Suggestion add(Suggestion suggestion) throws IOException, StorageLimitException {
        List<Suggestion> suggestions = findAll();
        if (suggestions.size() >= MAX_SUGGESTIONS) {
            throw new StorageLimitException("Se alcanzó el límite de sugerencias de este prototipo.");
        }
        suggestions.add(0, suggestion);
        writeAtomically(suggestions);
        return suggestion;
    }

    private void writeAtomically(List<Suggestion> suggestions) throws IOException {
        Path temporaryFile = Files.createTempFile(dataFile.getParent(), "suggestions-", ".tmp");
        try {
            mapper.writeValue(temporaryFile.toFile(), suggestions);
            try {
                Files.move(temporaryFile, dataFile,
                        StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(temporaryFile, dataFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temporaryFile);
        }
    }

    public static class StorageLimitException extends Exception {
        public StorageLimitException(String message) {
            super(message);
        }
    }
}
