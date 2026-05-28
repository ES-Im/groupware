package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.file.EmpFileResourceService;
import com.haruon.groupware.application.file.FileDomain;
import com.haruon.groupware.application.file.dto.result.FileDisposition;
import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.nio.charset.StandardCharsets;

/**
 * 파일 리소스 미리보기 / 다운로드 반환용
 */
@Controller
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileApi {

    private final EmpFileResourceService empFileResourceService;

    @GetMapping("/employees/{fileId}/preview")
    public ResponseEntity<Resource> previewEmpFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId
    ) {
        FileResourceResponse preview = empFileResourceService.preview(details.getEmpId(), fileId, FileDomain.EMP);

        return toResponseEntity(preview);
    }

    @GetMapping("/employees/{fileId}/download")
    public ResponseEntity<Resource> downloadEmpFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId
    ) {
        FileResourceResponse download = empFileResourceService.download(details.getEmpId(), fileId, FileDomain.EMP);

        return toResponseEntity(download);
    }



    @GetMapping("/drafts/{fileId}/download")
    public ResponseEntity<Resource> downloadDraftFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId
    ) {
//        FileResourceResponse download = draftFileResource
        return null;
    }

    private ResponseEntity<Resource> toResponseEntity(FileResourceResponse response) {
        ContentDisposition disposition = switch (response.disposition()) {
            case FileDisposition.INLINE -> ContentDisposition.inline()
                    .filename(response.originalName(), StandardCharsets.UTF_8)
                    .build();
            case FileDisposition.ATTACHMENT -> ContentDisposition.attachment()
                    .filename(response.originalName(), StandardCharsets.UTF_8)
                    .build();
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(response.mimeType()))
                .contentLength(response.fileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(response.resource());
    }
}
