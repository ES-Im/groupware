package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.application.file.provided.forRetriever.FileResourceRetriever;
import com.haruon.groupware.application.file.service.query.FileResourceRetrieverResolver;
import com.haruon.groupware.application.file.service.query.dto.FileDisposition;
import com.haruon.groupware.application.file.service.query.dto.FileResourceResponse;
import com.haruon.groupware.application.file.service.support.FileDomain;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.nio.charset.StandardCharsets;

/**
 * 파일 리소스 미리보기 / 다운로드 반환용
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/api")
public class FileQueryApi {

    private final FileResourceRetrieverResolver retrieverResolver;

    private FileResourceRetriever getRetrieverImpl(FileDomain domain) {
        return retrieverResolver.getRetriever(domain);
    }

    /** EMP FILE */
    @GetMapping("/employees/{empId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewEmpFile(
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EMP);

        FileResourceResponse preview = retrieverImpl.preview(empId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/employees/{empId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadEmpFile(
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EMP);

        FileResourceResponse download = retrieverImpl.download(empId, fileId);

        return toResponseEntity(download);
    }



    /** DRAFT FILE */
    @GetMapping("/drafts/{draftId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewDraftFile(
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.DRAFT);

        FileResourceResponse preview = retrieverImpl.preview(draftId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/drafts/{draftId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadDraftFile(
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.DRAFT);

        FileResourceResponse download = retrieverImpl.download(draftId, fileId);

        return toResponseEntity(download);
    }

    /** Board FILE */
    @GetMapping("/boards/{boardId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewBoardFile(
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.BOARD);

        FileResourceResponse preview = retrieverImpl.preview(boardId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/boards/{boardId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadBoardFile(
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.BOARD);

        FileResourceResponse download = retrieverImpl.download(boardId, fileId);

        return toResponseEntity(download);
    }

    /** Message FILE */
    @GetMapping("/messages/{messageId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewMessageFile(
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MESSAGE);

        FileResourceResponse preview = retrieverImpl.preview(messageId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/messages/{messageId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadMessageFile(
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MESSAGE);

        FileResourceResponse download = retrieverImpl.download(messageId, fileId);

        return toResponseEntity(download);
    }

    /** Education FILE */
    @GetMapping("/educations/{educationId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewEducationFile(
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EDUCATION);

        FileResourceResponse preview = retrieverImpl.preview(educationId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/educations/{educationId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadEducationFile(
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EDUCATION);

        FileResourceResponse download = retrieverImpl.download(educationId, fileId);

        return toResponseEntity(download);
    }


    /** MeetingRoom FILE */
    @GetMapping("/meeting-rooms/{meetingRoomId}/files/{fileId}/preview")
    public ResponseEntity<Resource> previewMeetingRoomFile(
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MEETING_ROOM);

        FileResourceResponse preview = retrieverImpl.preview(meetingRoomId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/meeting-rooms/{meetingRoomId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadMeetingRoomFile(
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MEETING_ROOM);

        FileResourceResponse download = retrieverImpl.download(meetingRoomId, fileId);

        return toResponseEntity(download);
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
