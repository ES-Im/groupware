package com.haruon.groupware.adapter.docs.webAPI.file;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.file.FileCommandApi;
import com.haruon.groupware.application.file.dto.request.*;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.fileService.forManagement.FileDeleteRequest;
import com.haruon.groupware.application.file.fileService.forManagement.FileManagerResolver;
import com.haruon.groupware.application.file.provided.FileDeletion;
import com.haruon.groupware.application.file.provided.FileUpload;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultHandler;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class FileForCommanderRestApiDocsTest extends RestDocsSupport {

    private static final long DOMAIN_ID = 1L;
    private static final long FILE_ID = 10L;

    private final FileManagerResolver<FileDeletion> deletionResolver = mock(FileManagerResolver.class);
    private final FileManagerResolver<FileUpload<?>> uploadResolver = mock(FileManagerResolver.class);
    private final FileDeletion fileDeletion = mock(FileDeletion.class);

    @SuppressWarnings("rawtypes")
    private final FileUpload fileUpload = mock(FileUpload.class);

    @Override
    protected Object initController() {
        return new FileCommandApi(deletionResolver, uploadResolver);
    }

    @Test
    @DisplayName("사원 파일 업로드 API")
    void upload_emp_file_success() throws Exception {
        documentUpload(
                FileDomain.EMP,
                "EMP_FILE_UPLOAD",
                "/api/employees/{empId}/files",
                "empId",
                "사원 식별 번호",
                "fileType",
                "사원 파일 타입. 예: PROFILE_PICTURE, SIGNATURE"
        );
    }

    @Test
    @DisplayName("사원 파일 삭제 API")
    void delete_emp_file_success() throws Exception {
        documentDelete(
                FileDomain.EMP,
                "EMP_FILE_DELETE",
                "/api/employees/{empId}/files/{fileId}",
                "empId",
                "사원 식별 번호"
        );
    }

    @Test
    @DisplayName("기안서 첨부 파일 업로드 API")
    void upload_draft_file_success() throws Exception {
        documentUpload(
                FileDomain.DRAFT,
                "DRAFT_FILE_UPLOAD",
                "/api/drafts/{draftId}/files",
                "draftId",
                "기안서 식별 번호",
                null,
                null
        );
    }

    @Test
    @DisplayName("기안서 첨부 파일 삭제 API")
    void delete_draft_file_success() throws Exception {
        documentDelete(
                FileDomain.DRAFT,
                "DRAFT_FILE_DELETE",
                "/api/drafts/{draftId}/files/{fileId}",
                "draftId",
                "기안서 식별 번호"
        );
    }

    @Test
    @DisplayName("게시판 첨부 파일 업로드 API")
    void upload_board_file_success() throws Exception {
        documentUpload(
                FileDomain.BOARD,
                "BOARD_FILE_UPLOAD",
                "/api/boards/{boardId}/files",
                "boardId",
                "게시글 식별 번호",
                null,
                null
        );
    }

    @Test
    @DisplayName("게시판 첨부 파일 삭제 API")
    void delete_board_file_success() throws Exception {
        documentDelete(
                FileDomain.BOARD,
                "BOARD_FILE_DELETE",
                "/api/boards/{boardId}/files/{fileId}",
                "boardId",
                "게시글 식별 번호"
        );
    }

    @Test
    @DisplayName("쪽지 첨부 파일 업로드 API")
    void upload_message_file_success() throws Exception {
        documentUpload(
                FileDomain.MESSAGE,
                "MESSAGE_FILE_UPLOAD",
                "/api/messages/{messageId}/files",
                "messageId",
                "쪽지 식별 번호",
                null,
                null
        );
    }

    @Test
    @DisplayName("쪽지 첨부 파일 삭제 API")
    void delete_message_file_success() throws Exception {
        documentDelete(
                FileDomain.MESSAGE,
                "MESSAGE_FILE_DELETE",
                "/api/messages/{messageId}/files/{fileId}",
                "messageId",
                "쪽지 식별 번호"
        );
    }

    @Test
    @DisplayName("교육 첨부 파일 업로드 API")
    void upload_education_file_success() throws Exception {
        documentUpload(
                FileDomain.EDUCATION,
                "EDUCATION_FILE_UPLOAD",
                "/api/educations/{educationId}/files",
                "educationId",
                "교육 식별 번호",
                null,
                null
        );
    }

    @Test
    @DisplayName("교육 첨부 파일 삭제 API")
    void delete_education_file_success() throws Exception {
        documentDelete(
                FileDomain.EDUCATION,
                "EDUCATION_FILE_DELETE",
                "/api/educations/{educationId}/files/{fileId}",
                "educationId",
                "교육 식별 번호"
        );
    }

    @Test
    @DisplayName("회의실 첨부 파일 업로드 API")
    void upload_meetingRoom_file_success() throws Exception {
        documentUpload(
                FileDomain.MEETING_ROOM,
                "MEETING_ROOM_FILE_UPLOAD",
                "/api/meeting-rooms/{meetingRoomId}/files",
                "meetingRoomId",
                "회의실 식별 번호",
                null,
                null
        );
    }

    @Test
    @DisplayName("회의실 첨부 파일 삭제 API")
    void delete_meetingRoom_file_success() throws Exception {
        documentDelete(
                FileDomain.MEETING_ROOM,
                "MEETING_ROOM_FILE_DELETE",
                "/api/meeting-rooms/{meetingRoomId}/files/{fileId}",
                "meetingRoomId",
                "회의실 식별 번호"
        );
    }

    @SuppressWarnings("unchecked")
    private void documentUpload(
            FileDomain fileDomain,
            String identifier,
            String path,
            String pathName,
            String pathNameDescription,
            String paramName,
            String paramNameDescription
    ) throws Exception {
        Mockito.doReturn(fileUpload)
                .when(uploadResolver)
                .getManager(eq(fileDomain));

        MockMultipartHttpServletRequestBuilder request = multipart(path, DOMAIN_ID)
                .file(uploadFile());

        request.with(req -> {
            req.setMethod("PATCH");
            return req;
        });
        request.with(employeeAuthentication());
        request.header("Authorization", "Bearer accessToken");

        if (paramName != null) {
            request.queryParam(paramName, "SIGNATURE");
        }

        mockMvc.perform(request)
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(documentUploadResult(
                        identifier,
                        pathName,
                        pathNameDescription,
                        paramName,
                        paramNameDescription
                ));

        ArgumentCaptor<FileUploadRequest> captor = ArgumentCaptor.forClass(FileUploadRequest.class);
        Mockito.verify(fileUpload).uploadResource(captor.capture());

        assertThat(captor.getValue()).isInstanceOf(uploadRequestType(fileDomain));
    }

    private void documentDelete(
            FileDomain fileDomain,
            String identifier,
            String path,
            String pathName,
            String pathNameDescription
    ) throws Exception {
        Mockito.when(deletionResolver.getManager(eq(fileDomain))).thenReturn(fileDeletion);

        mockMvc.perform(
                        delete(path, DOMAIN_ID, FILE_ID)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(print())
                .andExpect(status().isNoContent())
                .andDo(documentDeleteResult(identifier, pathName, pathNameDescription));

        ArgumentCaptor<FileDeleteRequest> captor = ArgumentCaptor.forClass(FileDeleteRequest.class);
        Mockito.verify(fileDeletion).deleteStoredResource(captor.capture());

        assertThat(captor.getValue()).extracting(
                FileDeleteRequest::requesterEmpId,
                FileDeleteRequest::domainPkId,
                FileDeleteRequest::fileId
        ).containsExactly(1L, DOMAIN_ID, FILE_ID);
    }

    private ResultHandler documentUploadResult(
            String identifier,
            String pathName,
            String pathNameDescription,
            String paramName,
            String paramNameDescription
    ) {
        if (paramName == null) {
            return document(
                    identifier,
                    preprocessRequest(prettyPrint()),
                    requestHeaders(
                            headerWithName("Authorization").description("Bearer Access Token")
                    ),
                    pathParameters(
                            parameterWithName(pathName).description(pathNameDescription)
                    ),
                    requestParts(
                            partWithName("file").description("업로드 파일")
                    )
            );
        }

        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                requestHeaders(
                        headerWithName("Authorization").description("Bearer Access Token")
                ),
                pathParameters(
                        parameterWithName(pathName).description(pathNameDescription)
                ),
                queryParameters(
                        parameterWithName(paramName).description(paramNameDescription)
                ),
                requestParts(
                        partWithName("file").description("업로드 파일")
                )
        );
    }

    private ResultHandler documentDeleteResult(
            String identifier,
            String pathName,
            String pathNameDescription
    ) {
        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                requestHeaders(
                        headerWithName("Authorization").description("Bearer Access Token")
                ),
                pathParameters(
                        parameterWithName(pathName).description(pathNameDescription),
                        parameterWithName("fileId").description("파일 식별 번호")
                )
        );
    }

    private MockMultipartFile uploadFile() {
        return new MockMultipartFile(
                "file",
                "file.jpg",
                "image/jpeg",
                "image".getBytes(StandardCharsets.UTF_8)
        );
    }

    private Class<? extends FileUploadRequest> uploadRequestType(FileDomain fileDomain) {
        return switch (fileDomain) {
            case EMP -> EmpFileUploadRequest.class;
            case DRAFT -> DraftFileUploadRequest.class;
            case BOARD -> BoardFileUploadRequest.class;
            case MESSAGE -> MessageFileUploadRequest.class;
            case EDUCATION -> EducationFileUploadRequest.class;
            case MEETING_ROOM -> MeetingRoomFileUploadRequest.class;
        };
    }
}
