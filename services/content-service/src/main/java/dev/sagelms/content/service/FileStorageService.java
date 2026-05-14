package dev.sagelms.content.service;

import dev.sagelms.content.dto.FileUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf");
    private static final long MAX_FILE_SIZE_BYTES = 25L * 1024L * 1024L;

    private final Path uploadDir;

    public FileStorageService(@Value("${app.storage.upload-dir:uploads/content}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public FileUploadResponse storePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size must be 25MB or less.");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf");
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.equalsIgnoreCase("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        try {
            Files.createDirectories(uploadDir);
            String storedFileName = UUID.randomUUID() + ".pdf";
            Path target = uploadDir.resolve(storedFileName).normalize();
            if (!target.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new FileUploadResponse(
                    storedFileName,
                    "application/pdf",
                    file.getSize(),
                    "/content/files/" + storedFileName);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store uploaded file.", ex);
        }
    }

    public Resource load(String fileName) {
        String cleanName = StringUtils.cleanPath(fileName);
        if (cleanName.contains("..") || !cleanName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new FileNotFoundException(fileName);
        }
        try {
            Path file = uploadDir.resolve(cleanName).normalize();
            if (!file.startsWith(uploadDir) || !Files.exists(file)) {
                throw new FileNotFoundException(fileName);
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new FileNotFoundException(fileName);
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new FileNotFoundException(fileName);
        }
    }

    private String getExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index < 0 || index == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(index + 1).toLowerCase(Locale.ROOT);
    }

    public static class FileNotFoundException extends RuntimeException {
        public FileNotFoundException(String fileName) {
            super("File not found: " + fileName);
        }
    }
}
