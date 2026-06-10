package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.adapter.file.MultipartFileConverter;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.file.dto.request.*;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.fileService.forManagement.FileManagerResolver;
import com.haruon.groupware.application.file.provided.FileDeletion;
import com.haruon.groupware.application.file.provided.FileUpload;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.file.dto.request.BoardFileUploadRequest.toBoardFileUploadRequest;
import static com.haruon.groupware.application.file.dto.request.DraftFileUploadRequest.toDraftFileUploadRequest;
import static com.haruon.groupware.application.file.dto.request.EducationFileUploadRequest.toEducationFileUploadRequest;
import static com.haruon.groupware.application.file.dto.request.EmpFileUploadRequest.toEmpFileUploadRequest;
import static com.haruon.groupware.application.file.dto.request.MeetingRoomFileUploadRequest.toMeetingRoomFileUploadRequest;
import static com.haruon.groupware.application.file.dto.request.MessageFileUploadRequest.toMessageFileUploadRequest;
import static com.haruon.groupware.application.file.fileService.forManagement.FileDeleteRequest.toFileDeleteRequest;
import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api")
public class FileCommandApi {

    private final FileManagerResolver<FileDeletion> deletionResolver;
    private final FileManagerResolver<FileUpload<?>> uploadResolver;

    private FileDeletion getManagerImpl(FileDomain domain) {
        return deletionResolver.getManager(domain);
    }

    @SuppressWarnings("unchecked")
    private <T extends FileUploadRequest> FileUpload<T> getUploadImpl(FileDomain domain) {
        return (FileUpload<T>) uploadResolver.getManager(domain);
    }


    /** EMP FILE */
    @PatchMapping(value = "/employees/{empId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addEmpFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam("fileType") FileType fileType,
            @RequestPart("file") MultipartFile file
    ) {
        if (!details.getEmpId().equals(empId)) throw new PermissionDeniedException();

        EmpFileUploadRequest request = toEmpFileUploadRequest(empId, fileType, MultipartFileConverter.from(file));

        FileUpload<EmpFileUploadRequest> upload = getUploadImpl(FileDomain.EMP);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/employees/{empId}/files/{fileId}")
    public ResponseEntity<Void> deleteMeFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.EMP);

        if (!details.getEmpId().equals(empId)) throw new PermissionDeniedException();

        managerImpl.deleteStoredResource(toFileDeleteRequest(details.getEmpId(), empId, fileId));

        return ResponseEntity.noContent().build();
    }


    /** DRAFT FILE */
    @PatchMapping(value = "/drafts/{draftId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addDraftFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestPart("file") MultipartFile file
    ) {
        DraftFileUploadRequest request = toDraftFileUploadRequest(draftId, details.getEmpId(), MultipartFileConverter.from(file));

        FileUpload<DraftFileUploadRequest> upload = getUploadImpl(FileDomain.DRAFT);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/drafts/{draftId}/files/{fileId}")
    public ResponseEntity<Void> deleteDraftFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.DRAFT);
        managerImpl.deleteStoredResource(toFileDeleteRequest(details.getEmpId(), draftId, fileId));

        return ResponseEntity.noContent().build();
    }


    /** Board FILE */
    @PatchMapping(value = "/boards/{boardId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addBoardFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @RequestPart("file") MultipartFile file
    ) {
        BoardFileUploadRequest request = toBoardFileUploadRequest(boardId, details.getEmpId(), MultipartFileConverter.from(file), LocalDateTime.now(ZONE_SEOUL));

        FileUpload<BoardFileUploadRequest> upload = getUploadImpl(FileDomain.BOARD);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/boards/{boardId}/files/{fileId}")
    public ResponseEntity<Void> deleteBoardFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.BOARD);
        managerImpl.deleteStoredResource(toFileDeleteRequest(details.getEmpId(), boardId, fileId));

        return ResponseEntity.noContent().build();
    }


    /** Message FILE */

    @PatchMapping(value = "/messages/{messageId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addMessageFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId,
            @RequestPart("file") MultipartFile file
    ) {
        MessageFileUploadRequest request = toMessageFileUploadRequest(details.getEmpId(), messageId, MultipartFileConverter.from(file));

        FileUpload<MessageFileUploadRequest> upload = getUploadImpl(FileDomain.MESSAGE);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/messages/{messageId}/files/{fileId}")
    public ResponseEntity<Void> deleteMessageFile(
            @AuthenticationPrincipal EmpDetails empDetails,
            @PathVariable Long messageId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.MESSAGE);
        managerImpl.deleteStoredResource(toFileDeleteRequest(empDetails.getEmpId(), messageId, fileId));

        return ResponseEntity.noContent().build();
    }


    /** Education FILE */
    @PatchMapping(value = "/educations/{educationId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addEducationFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId,
            @RequestPart("file") MultipartFile file
    ) {
        EducationFileUploadRequest request = toEducationFileUploadRequest(educationId, details.getEmpId(), MultipartFileConverter.from(file));

        FileUpload<EducationFileUploadRequest> upload = getUploadImpl(FileDomain.EDUCATION);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/educations/{educationId}/files/{fileId}")
    public ResponseEntity<Void> deleteEducationFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.EDUCATION);
        managerImpl.deleteStoredResource(toFileDeleteRequest(details.getEmpId(), educationId, fileId));

        return ResponseEntity.noContent().build();
    }


    /** MeetingRoom FILE */

    @PatchMapping(value = "/meeting-rooms/{meetingRoomId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addMeetingRoomFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingRoomId,
            @RequestPart("file") MultipartFile file
    ) {
        MeetingRoomFileUploadRequest request = toMeetingRoomFileUploadRequest(details.getEmpId(), meetingRoomId, MultipartFileConverter.from(file));

        FileUpload<MeetingRoomFileUploadRequest> upload = getUploadImpl(FileDomain.MEETING_ROOM);
        upload.uploadResource(request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/meeting-rooms/{meetingRoomId}/files/{fileId}")
    public ResponseEntity<Void> deleteMeetingRoomFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long meetingRoomId,
            @PathVariable Long fileId
    ) {
        FileDeletion managerImpl = getManagerImpl(FileDomain.MEETING_ROOM);
        managerImpl.deleteStoredResource(toFileDeleteRequest(details.getEmpId(), meetingRoomId, fileId));

        return ResponseEntity.noContent().build();
    }
}
