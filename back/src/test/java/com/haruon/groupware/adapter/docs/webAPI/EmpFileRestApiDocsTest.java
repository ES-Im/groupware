package com.haruon.groupware.adapter.docs.webAPI;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.file.FileApi;
import com.haruon.groupware.application.file.EmpFileResourceService;
import com.haruon.groupware.application.file.FileDomain;
import com.haruon.groupware.application.file.dto.result.FileDisposition;
import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class EmpFileRestApiDocsTest extends RestDocsSupport {

    private final EmpFileResourceService empFileResourceService = mock(EmpFileResourceService.class);

    @Override
    protected Object initController() {
        return new FileApi(empFileResourceService);
    }

    @Test
    @DisplayName("사원 파일 미리보기 테스트")
    void preview_success() throws Exception {
        FileResourceResponse response = new FileResourceResponse(
                new ByteArrayResource("preview-content".getBytes(StandardCharsets.UTF_8)),
                "profile.jpg",
                "image/jpeg",
                15L,
                FileDisposition.INLINE
        );

        Mockito.when(empFileResourceService.preview(eq(1L), eq(10L), eq(FileDomain.EMP)))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/files/employees/{fileId}/preview", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andDo(document("EMP_FILE_PREVIEW",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("fileId").description("파일 식별 번호")
                        ),
                        responseHeaders(
                                headerWithName(HttpHeaders.CONTENT_TYPE).description("파일 MIME 타입"),
                                headerWithName(HttpHeaders.CONTENT_LENGTH).description("파일 크기"),
                                headerWithName(HttpHeaders.CONTENT_DISPOSITION).description("inline 미리보기")
                        )
                ));
    }

    @Test
    @DisplayName("사원 파일 다운로드 API")
    void download_success() throws Exception {
        FileResourceResponse response = new FileResourceResponse(
                new ByteArrayResource("download-content".getBytes(StandardCharsets.UTF_8)),
                "profile.jpg",
                "image/jpeg",
                16L,
                FileDisposition.ATTACHMENT
        );

        Mockito.when(empFileResourceService.download(eq(1L), eq(10L), eq(FileDomain.EMP)))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/files/employees/{fileId}/download", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andDo(document("EMP_FILE_DOWNLOAD",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("fileId").description("파일 식별 번호")
                        ),
                        responseHeaders(
                                headerWithName(HttpHeaders.CONTENT_TYPE).description("파일 MIME 타입"),
                                headerWithName(HttpHeaders.CONTENT_LENGTH).description("파일 크기"),
                                headerWithName(HttpHeaders.CONTENT_DISPOSITION).description("attachment 다운로드")
                        )
                ));
    }
}
