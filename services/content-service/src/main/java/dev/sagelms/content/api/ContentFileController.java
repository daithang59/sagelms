package dev.sagelms.content.api;

import dev.sagelms.content.dto.FileUploadResponse;
import dev.sagelms.content.security.RoleUtils;
import dev.sagelms.content.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/content/files")
public class ContentFileController {

    private static final String ROLES_HEADER = "X-User-Roles";

    private final FileStorageService fileStorageService;

    public ContentFileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(ROLES_HEADER) String roles) {
        if (!RoleUtils.isInstructor(roles) && !RoleUtils.isAdmin(roles)) {
            throw new IllegalArgumentException("Instructor or admin role required.");
        }
        return ResponseEntity.ok(fileStorageService.storePdf(file));
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        Resource resource = fileStorageService.load(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
