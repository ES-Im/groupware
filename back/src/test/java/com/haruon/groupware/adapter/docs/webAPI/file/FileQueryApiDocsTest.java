package com.haruon.groupware.adapter.docs.webapi.file;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.file.FileQueryApi;
import com.haruon.groupware.application.file.provided.forRetriever.FileResourceRetriever;
import com.haruon.groupware.application.file.service.query.FileResourceRetrieverResolver;
import com.haruon.groupware.application.file.service.query.dto.FileDisposition;
import com.haruon.groupware.application.file.service.query.dto.FileResourceResponse;
import com.haruon.groupware.application.file.service.support.FileDomain;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.ResultHandler;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.*;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class FileQueryApiDocsTest extends RestDocsSupport {

    private final FileResourceRetrieverResolver retrieverMapper = mock(FileResourceRetrieverResolver.class);
    private final FileResourceRetriever resourceRetriever = mock(FileResourceRetriever.class);


    @Override
    protected Object initController() {
        return new FileQueryApi(retrieverMapper);
    }

    @Test
    @DisplayName("사원 파일 미리보기 테스트")
    void preview_success() throws Exception {
        documentPreview(
                FileDomain.EMP,
                "EMP_FILE_PREVIEW",
                "/api/employees/{empId}/files/{fileId}/preview",
                "empId",
                "사원 식별 번호"
        );
    }

    @Test
    @DisplayName("사원 파일 다운로드 API")
    void download_success() throws Exception {
        documentDownload(
                FileDomain.EMP,
                "EMP_FILE_DOWNLOAD",
                "/api/employees/{empId}/files/{fileId}/download",
                "empId",
                "사원 식별 번호"
        );
    }

    @Test
    @DisplayName("기안서 첨부 파일 미리보기 API")
    void previewDraftFile_success() throws Exception {
        documentPreview(
                FileDomain.DRAFT,
                "DRAFT_FILE_PREVIEW",
                "/api/drafts/{draftId}/files/{fileId}/preview",
                "draftId",
                "기안서 식별 번호"
        );
    }

    @Test
    @DisplayName("기안서 첨부 파일 다운로드 API")
    void downloadDraftFile_success() throws Exception {
        documentDownload(
                FileDomain.DRAFT,
                "DRAFT_FILE_DOWNLOAD",
                "/api/drafts/{draftId}/files/{fileId}/download",
                "draftId",
                "기안서 식별 번호"
        );
    }

    @Test
    @DisplayName("게시판 첨부 파일 미리보기 API")
    void previewBoardFile_success() throws Exception {
        documentPreview(
                FileDomain.BOARD,
                "BOARD_FILE_PREVIEW",
                "/api/boards/{boardId}/files/{fileId}/preview",
                "boardId",
                "게시글 식별 번호"
        );
    }

    @Test
    @DisplayName("게시판 첨부 파일 다운로드 API")
    void downloadBoardFile_success() throws Exception {
        documentDownload(
                FileDomain.BOARD,
                "BOARD_FILE_DOWNLOAD",
                "/api/boards/{boardId}/files/{fileId}/download",
                "boardId",
                "게시글 식별 번호"
        );
    }

    @Test
    @DisplayName("쪽지 첨부 파일 미리보기 API")
    void previewMessageFile_success() throws Exception {
        documentPreview(
                FileDomain.MESSAGE,
                "MESSAGE_FILE_PREVIEW",
                "/api/messages/{messageId}/files/{fileId}/preview",
                "messageId",
                "쪽지 식별 번호"
        );
    }

    @Test
    @DisplayName("쪽지 첨부 파일 다운로드 API")
    void downloadMessageFile_success() throws Exception {
        documentDownload(
                FileDomain.MESSAGE,
                "MESSAGE_FILE_DOWNLOAD",
                "/api/messages/{messageId}/files/{fileId}/download",
                "messageId",
                "쪽지 식별 번호"
        );
    }

    @Test
    @DisplayName("교육 첨부 파일 미리보기 API")
    void previewEducationFile_success() throws Exception {
        documentPreview(
                FileDomain.EDUCATION,
                "EDUCATION_FILE_PREVIEW",
                "/api/educations/{educationId}/files/{fileId}/preview",
                "educationId",
                "교육 식별 번호"
        );
    }

    @Test
    @DisplayName("교육 첨부 파일 다운로드 API")
    void downloadEducationFile_success() throws Exception {
        documentDownload(
                FileDomain.EDUCATION,
                "EDUCATION_FILE_DOWNLOAD",
                "/api/educations/{educationId}/files/{fileId}/download",
                "educationId",
                "교육 식별 번호"
        );
    }

    @Test
    @DisplayName("회의실 첨부 파일 미리보기 API")
    void previewMeetingRoomFile_success() throws Exception {
        documentPreview(
                FileDomain.MEETING_ROOM,
                "MEETING_ROOM_FILE_PREVIEW",
                "/api/meeting-rooms/{meetingRoomId}/files/{fileId}/preview",
                "meetingRoomId",
                "회의실 식별 번호"
        );
    }

    @Test
    @DisplayName("회의실 첨부 파일 다운로드 API")
    void downloadMeetingRoomFile_success() throws Exception {
        documentDownload(
                FileDomain.MEETING_ROOM,
                "MEETING_ROOM_FILE_DOWNLOAD",
                "/api/meeting-rooms/{meetingRoomId}/files/{fileId}/download",
                "meetingRoomId",
                "회의실 식별 번호"
        );
    }

    private void documentPreview(
            FileDomain domain,
            String identifier,
            String path,
            String domainPathName,
            String domainPathDescription
    ) throws Exception {
        FileResourceResponse response = previewResponse();

        Mockito.when(retrieverMapper.getRetriever(eq(domain))).thenReturn(resourceRetriever);
        Mockito.when(resourceRetriever.preview(eq(1L), eq(10L)))
                .thenReturn(response);

        mockMvc.perform(
                        get(path, 1L, 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andDo(documentFileResource(
                        identifier,
                        domainPathName,
                        domainPathDescription,
                        "inline 미리보기"
                ));
    }

    private void documentDownload(
            FileDomain domain,
            String identifier,
            String path,
            String domainPathName,
            String domainPathDescription
    ) throws Exception {
        FileResourceResponse response = downloadResponse();

        Mockito.when(retrieverMapper.getRetriever(eq(domain))).thenReturn(resourceRetriever);
        Mockito.when(resourceRetriever.download(eq(1L), eq(10L)))
                .thenReturn(response);

        mockMvc.perform(
                        get(path, 1L, 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andDo(documentFileResource(
                        identifier,
                        domainPathName,
                        domainPathDescription,
                        "attachment 다운로드"
                ));
    }

    private ResultHandler documentFileResource(
            String identifier,
            String domainPathName,
            String domainPathDescription,
            String contentDispositionDescription
    ) {
        return document(identifier,
                preprocessRequest(prettyPrint()),
                requestHeaders(
                        headerWithName("Authorization").description("Bearer Access Token")
                ),
                pathParameters(
                        parameterWithName(domainPathName).description(domainPathDescription),
                        parameterWithName("fileId").description("파일 식별 번호")
                ),
                responseHeaders(
                        headerWithName(HttpHeaders.CONTENT_TYPE).description("파일 MIME 타입"),
                        headerWithName(HttpHeaders.CONTENT_LENGTH).description("파일 크기"),
                        headerWithName(HttpHeaders.CONTENT_DISPOSITION).description(contentDispositionDescription)
                )
        );
    }

    private FileResourceResponse previewResponse() {
        return new FileResourceResponse(
                new ByteArrayResource("preview-content".getBytes(StandardCharsets.UTF_8)),
                "profile.jpg",
                "image/jpeg",
                15L,
                FileDisposition.INLINE
        );
    }

    private FileResourceResponse downloadResponse() {
        return new FileResourceResponse(
                new ByteArrayResource("download-content".getBytes(StandardCharsets.UTF_8)),
                "profile.jpg",
                "image/jpeg",
                16L,
                FileDisposition.ATTACHMENT
        );
    }


}
