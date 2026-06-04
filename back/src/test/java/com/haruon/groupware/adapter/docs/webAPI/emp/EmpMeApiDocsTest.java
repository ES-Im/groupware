package com.haruon.groupware.adapter.docs.webAPI.emp;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.account.EmpMeAPI;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.EmpFileListInfo;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.util.List;

import static com.haruon.groupware.adapter.docs.webAPI.emp.empApiSupport.getEmpInfoResponse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class EmpMeApiDocsTest extends RestDocsSupport {

    private final EmpAccountManager empAccountManager = mock(EmpAccountManager.class);
    private final EmpAccountRetriever empAccountRetriever = mock(EmpAccountRetriever.class);

    @Override
    protected Object initController() {
        return new EmpMeAPI(empAccountManager, empAccountRetriever);
    }



    @Test
    @DisplayName("개인정보 조회 테스트")
    void retriever_me_info_success() throws Exception {
        EmpInfoResponse empInfoResponse = getEmpInfoResponse();

        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(any())).thenReturn(empInfoResponse);

        mockMvc.perform(
                        get("/api/employees/me")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_ME_INFO",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("empBasicInfo").type(JsonFieldType.OBJECT).description("사원의 기본정보"),
                                fieldWithPath("empBasicInfo.empNo").type(JsonFieldType.STRING).description("사원 번호"),
                                fieldWithPath("empBasicInfo.name").type(JsonFieldType.STRING).description("사원 이름"),
                                fieldWithPath("empBasicInfo.loginId").type(JsonFieldType.STRING).description("아이디"),
                                fieldWithPath("empBasicInfo.email").type(JsonFieldType.STRING).description("이메일"),
                                fieldWithPath("empBasicInfo.extensionNo").type(JsonFieldType.STRING).description("사무실 번호"),

                                fieldWithPath("activeFiles").type(JsonFieldType.ARRAY).description("활성화된 사원의 프로필/전자서명 이미지 파일"),
                                fieldWithPath("activeFiles[].file").type(JsonFieldType.OBJECT).description("파일 기본 정보"),
                                fieldWithPath("activeFiles[].file.fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("activeFiles[].file.originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("activeFiles[].file.extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("activeFiles[].file.fileSize").type(JsonFieldType.NUMBER).description("파일 크기"),
                                fieldWithPath("activeFiles[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("activeFiles[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부, (True만 출력)"),

                                fieldWithPath("currentDepts").type(JsonFieldType.ARRAY).description("현재 소속정보"),
                                fieldWithPath("currentDepts[].deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                fieldWithPath("currentDepts[].deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                fieldWithPath("currentDepts[].deptName").type(JsonFieldType.STRING).description("부서명"),
                                fieldWithPath("currentDepts[].positionName").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("currentDepts[].isPrimary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
                                fieldWithPath("currentDepts[].startAt").type(JsonFieldType.STRING).description("발령 시작일"),
                                fieldWithPath("currentDepts[].endAt").type(JsonFieldType.NULL).description("종료일, 현재 소속만 출력(현재 소속이면 null)")

                        )

                ));
    }



    @Test
    @DisplayName("개인정보 조회 실패 테스트")
    void retriever_me_info_fail() throws Exception {
        ActiveEmployeeNotFoundException ex = new ActiveEmployeeNotFoundException();
        Mockito.when(empAccountRetriever.retrieveEmpAccountInfo(any())).thenThrow(ex);

        mockMvc.perform(
                        get("/api/employees/me")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().is(ex.getErrorCode().getStatus().value()))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(ex.getErrorCode().getCode()))
                .andExpect(jsonPath("$.message").value(ex.getErrorCode().getMessage()))
                .andExpect(jsonPath("$.httpStatus").value(ex.getErrorCode().getStatus().value()))
                .andDo(document("RETRIEVE_ME_INFO_FAIL",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        responseFields(
                                fieldWithPath("code").description("에러 코드"),
                                fieldWithPath("name").description("에러 이름"),
                                fieldWithPath("httpStatus").description("HTTP 상태 코드"),
                                fieldWithPath("message").description("에러 메시지")
                        )
                ));
    }


    @Test
    @DisplayName("개인파일(프로필, 전자서명) 조회 테스트")
    void retriever_me_files_info_success() throws Exception {
        List<EmpFileListInfo> fileInfos = List.of(
                new EmpFileListInfo(1L, "storedFile1", "jpg", 1024L*1024, true, FileType.SIGNATURE),
                new EmpFileListInfo(2L, "storedFile2", "jpg", 1024L*1024, false, FileType.PROFILE_PICTURE)
        );


        Mockito.when(empAccountRetriever.retrieveEmpFilesInfo(any())).thenReturn(fileInfos);

        mockMvc.perform(
                        get("/api/employees/me/files")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_FILES_INFOS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("[].file").type(JsonFieldType.OBJECT).description("파일 기본 정보"),
                                fieldWithPath("[].file.fileId").type(JsonFieldType.NUMBER).description("파일 식별 번호"),
                                fieldWithPath("[].file.originalName").type(JsonFieldType.STRING).description("파일 원본명"),
                                fieldWithPath("[].file.extension").type(JsonFieldType.STRING).description("파일 확장자"),
                                fieldWithPath("[].file.fileSize").type(JsonFieldType.NUMBER).description("파일 크기"),
                                fieldWithPath("[].type").type(JsonFieldType.STRING).description("파일 타입(프로필사진or전자서명파일)"),
                                fieldWithPath("[].isActive").type(JsonFieldType.BOOLEAN).description("파일 활성화 여부")
                        )

                ));
    }


    @Test
    @DisplayName("개인 소속정보 조회 테스트")
    void retriever_belongings_info_success() throws Exception {
        List<BelongingInfo> belongingInfoList = List.of(
                new BelongingInfo(1L, "DEPT1", "부서1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                new BelongingInfo(2L, "DEPT2", "부서2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
        );

        Mockito.when(empAccountRetriever.retrieveEmpBelongingsInfo(any())).thenReturn(belongingInfoList);

        mockMvc.perform(
                        get("/api/employees/me/belongings")
                                .with(employeeAuthentication())
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("RETRIEVE_BELONGINGS_INFOS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        responseFields(
                                fieldWithPath("[].deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                fieldWithPath("[].deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                fieldWithPath("[].deptName").type(JsonFieldType.STRING).description("부서명"),
                                fieldWithPath("[].positionName").type(JsonFieldType.STRING).description("직급"),
                                fieldWithPath("[].isPrimary").type(JsonFieldType.BOOLEAN).description("주요부서여부"),
                                fieldWithPath("[].startAt").type(JsonFieldType.STRING).description("발령 시작일"),
                                fieldWithPath("[].endAt").type(JsonFieldType.NULL).description("종료일")
                        )
                ));
    }

    @Test
    @DisplayName("개인정보 변경 테스트")
    void update_me_success() throws Exception {

        EmpUpdateRequestBySelf request = EmpUpdateRequestBySelf.builder()
                .extensionNo("123-4567")
                .newRawPassword("newPassword@123")
                .build();

        Mockito.doNothing().when(empAccountManager).updateInfoBySelf(any(EmpUpdateRequestBySelf.class), anyLong());

        mockMvc.perform(
                        patch("/api/employees/me")
                                .with(employeeAuthentication())
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("Authorization", "accessToken")
                ).andExpect(status().isOk())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("UPDATE_SELF_INFO",
                                preprocessRequest(prettyPrint()),
                                preprocessResponse(prettyPrint()),

                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),

                                requestFields(
                                        fieldWithPath("extensionNo").type(JsonFieldType.STRING).type(JsonFieldType.STRING)
                                                .attributes(key("constraints").value("3자리 숫자 - 4자리 숫자 형식"))
                                                .description("사무실 직통 번호"),
                                        fieldWithPath("newRawPassword").type(JsonFieldType.STRING)
                                                .attributes(key("constraints").value("8자이상, 영문+숫자+특수문자 조합"))
                                                .type(JsonFieldType.STRING).description("새로운 비밀번호")
                                )


                        )
                );

    }

    @Test
    @DisplayName("파일 활성화/비활성화 테스트")
    void activate_file() throws Exception {
        Mockito.doNothing()
                .when(empAccountManager).updateFileActiveStatusBySelf(anyLong(), any(Boolean.class), anyLong());

        mockMvc.perform(
                        patch("/api/employees/me/files/{fileId}/status", 1L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .param("isForActivate", "true")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("ACTIVATE_ME_FILE",
                                preprocessRequest(prettyPrint()),
                                preprocessResponse(prettyPrint()),

                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),

                                pathParameters(
                                        parameterWithName("fileId").description("파일 식별 번호")
                                )

                        )
                );
    }


}
