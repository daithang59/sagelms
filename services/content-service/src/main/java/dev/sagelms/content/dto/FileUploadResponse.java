package dev.sagelms.content.dto;

public record FileUploadResponse(
        String fileName,
        String contentType,
        long size,
        String url
) {}
