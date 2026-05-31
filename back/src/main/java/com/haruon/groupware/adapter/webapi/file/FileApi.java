package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.adapter.file.MultipartFileConverter;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.file.dto.request.EmpFileUploadRequest;
import com.haruon.groupware.application.file.dto.request.FileUploadRequest;
import com.haruon.groupware.application.file.dto.result.FileDisposition;
import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.fileService.forManagement.FileManagerResolver;
import com.haruon.groupware.application.file.fileService.forRetriever.FileResourceRetrieverResolver;
import com.haruon.groupware.application.file.provided.FileDeletion;
import com.haruon.groupware.application.file.provided.FileResourceRetriever;
import com.haruon.groupware.application.file.provided.FileUpload;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

import static com.haruon.groupware.application.file.fileService.forManagement.FileDeleteRequest.toFileDeleteRequest;

/**
 * 파일 리소스 미리보기 / 다운로드 반환용
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/api/files")
public class FileApi {

    private final FileResourceRetrieverResolver retrieverResolver;
    private final FileManagerResolver<FileDeletion> deletionResolver;
    private final FileManagerResolver<FileUpload<?>> uploadResolver;

    private FileResourceRetriever getRetrieverImpl(FileDomain domain) {
        return retrieverResolver.getRetriever(domain);
    }

    private FileDeletion getManagerImpl(FileDomain domain) {
        return deletionResolver.getManager(domain);
    }

    @SuppressWarnings("unchecked")
    private <T extends FileUploadRequest> FileUpload<T> getUploadImpl(FileDomain domain) {
        return (FileUpload<T>) uploadResolver.getManager(domain);
    }

    /** EMP FILE */
    @GetMapping("/employees/{empId}/{fileId}/preview")
    public ResponseEntity<Resource> previewEmpFile(
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EMP);

        FileResourceResponse preview = retrieverImpl.preview(empId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/employees/{empId}/{fileId}/download")
    public ResponseEntity<Resource> downloadEmpFile(
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EMP);

        FileResourceResponse download = retrieverImpl.download(empId, fileId);

        return toResponseEntity(download);
    }

    @PatchMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addMeFile(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam("fileType") FileType fileType,
            @RequestPart("file") MultipartFile file
    ) {
        EmpFileUploadRequest request = EmpFileUploadRequest.builder()
                .empId(details.getEmpId())
                .fileType(fileType)
                .file(MultipartFileConverter.from(file))
                .build();

        FileUpload<EmpFileUploadRequest> upload = getUploadImpl(FileDomain.EMP);
        upload.uploadResource(request);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/employees/{empId}/{fileId}")
    public ResponseEntity<Void> deleteMeFile(
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.EMP);

        managerImpl.deleteStoredResource(toFileDeleteRequest(empId, fileId));

        return ResponseEntity.ok().build();
    }

    /** DRAFT FILE */
    @GetMapping("/drafts/{draftId}/{fileId}/preview")
    public ResponseEntity<Resource> previewDraftFile(
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.DRAFT);

        FileResourceResponse preview = retrieverImpl.preview(draftId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/drafts/{draftId}/{fileId}/download")
    public ResponseEntity<Resource> downloadDraftFile(
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.DRAFT);

        FileResourceResponse download = retrieverImpl.download(draftId, fileId);

        return toResponseEntity(download);
    }

    @DeleteMapping("/drafts/{draftId}/{fileId}")
    public ResponseEntity<Void> deleteDraftFile(
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.DRAFT);
        managerImpl.deleteStoredResource(toFileDeleteRequest(draftId, fileId));

        return ResponseEntity.ok().build();
    }

    /** Board FILE */
    @GetMapping("/boards/{boardId}/{fileId}/preview")
    public ResponseEntity<Resource> previewBoardFile(
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.BOARD);

        FileResourceResponse preview = retrieverImpl.preview(boardId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/boards/{boardId}/{fileId}/download")
    public ResponseEntity<Resource> downloadBoardFile(
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.BOARD);

        FileResourceResponse download = retrieverImpl.download(boardId, fileId);

        return toResponseEntity(download);
    }

    @DeleteMapping("/boards/{boardId}/{fileId}")
    public ResponseEntity<Void> deleteBoardFile(
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.BOARD);
        managerImpl.deleteStoredResource(toFileDeleteRequest(boardId, fileId));

        return ResponseEntity.ok().build();
    }

    /** Message FILE */
    @GetMapping("/messages/{messageId}/{fileId}/preview")
    public ResponseEntity<Resource> previewMessageFile(
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MESSAGE);

        FileResourceResponse preview = retrieverImpl.preview(messageId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/messages/{messageId}/{fileId}/download")
    public ResponseEntity<Resource> downloadMessageFile(
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MESSAGE);

        FileResourceResponse download = retrieverImpl.download(messageId, fileId);

        return toResponseEntity(download);
    }

    @DeleteMapping("/messages/{messageId}/{fileId}")
    public ResponseEntity<Void> deleteMessageFile(
            @AuthenticationPrincipal EmpDetails empDetails,
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.MESSAGE);
        managerImpl.deleteStoredResource(toFileDeleteRequest(empDetails.getEmpId(), messageId, fileId));

        return ResponseEntity.ok().build();
    }

    /** Education FILE */
    @GetMapping("/educations/{educationId}/{fileId}/preview")
    public ResponseEntity<Resource> previewEducationFile(
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EDUCATION);

        FileResourceResponse preview = retrieverImpl.preview(educationId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/educations/{educationId}/{fileId}/download")
    public ResponseEntity<Resource> downloadEducationFile(
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.EDUCATION);

        FileResourceResponse download = retrieverImpl.download(educationId, fileId);

        return toResponseEntity(download);
    }

    @DeleteMapping("/educations/{educationId}/{fileId}")
    public ResponseEntity<Void> deleteEducationFile(
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.EDUCATION);
        managerImpl.deleteStoredResource(toFileDeleteRequest(educationId, fileId));

        return ResponseEntity.ok().build();
    }

    /** MeetingRoom FILE */
    @GetMapping("/meetingRooms/{meetingRoomId}/{fileId}/preview")
    public ResponseEntity<Resource> previewMeetingRoomFile(
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MEETING_ROOM);

        FileResourceResponse preview = retrieverImpl.preview(meetingRoomId, fileId);

        return toResponseEntity(preview);
    }

    @GetMapping("/meetingRooms/{meetingRoomId}/{fileId}/download")
    public ResponseEntity<Resource> downloadMeetingRoomFile(
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileResourceRetriever retrieverImpl = getRetrieverImpl(FileDomain.MEETING_ROOM);

        FileResourceResponse download = retrieverImpl.download(meetingRoomId, fileId);

        return toResponseEntity(download);
    }

    @DeleteMapping("/meetingRooms/{meetingRoomId}/{fileId}")
    public ResponseEntity<Void> deleteMeetingRoomFile(
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.MEETING_ROOM);
        managerImpl.deleteStoredResource(toFileDeleteRequest(meetingRoomId, fileId));

        return ResponseEntity.ok().build();
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
