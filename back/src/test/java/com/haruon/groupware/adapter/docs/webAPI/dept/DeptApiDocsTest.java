package com.haruon.groupware.adapter.docs.webAPI.dept;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.dept.DeptApi;
import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptMemberInfo;
import com.haruon.groupware.application.dept.provided.DeptRetriever;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DeptApiDocsTest extends RestDocsSupport {

    private final DeptRetriever deptRetriever = mock(DeptRetriever.class);
    private final static String REQUEST_MAPPING = "/api/departments";

    DeptApiSupport support = new DeptApiSupport();

    @Override
    protected Object initController() {
        return new DeptApi(deptRetriever);
    }

    @Test
    @DisplayName("부서 전체 조회")
    void getDepts_success() throws Exception {

        List<DeptInfoResponse> responses = support.getDeptInfoListResponses();

        Mockito.when(deptRetriever.retrieverDeptInfoList(anyBoolean(), anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(responses, PageRequest.of(0, 10), responses.size()));

        mockMvc.perform(
                get(REQUEST_MAPPING)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .param("keyword", " ")
                        .param("isActive", "true")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("DEPTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(
                                parameterWithName("keyword").optional().description("부서 이름 검색어"),
                                parameterWithName("isActive").optional().description("활성화 부서 필터링 \n 미선택시, 모든 상태의 부서 포함 출력"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),

                        responseFields(
                                fieldWithPath("content").type(JsonFieldType.ARRAY).description(" "),
                                fieldWithPath("content[].deptInfoResponse").type(JsonFieldType.OBJECT).description("부서 정보"),
                                fieldWithPath("content[].deptInfoResponse.deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                fieldWithPath("content[].deptInfoResponse.deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                fieldWithPath("content[].deptInfoResponse.deptName").type(JsonFieldType.STRING).description("부서명"),
                                fieldWithPath("content[].deptInfoResponse.isActive").type(JsonFieldType.BOOLEAN).description("부서 활성화 여부"),
                                fieldWithPath("content[].deptInfoResponse.parentDeptId").optional().type(JsonFieldType.NUMBER).description("상위 부서 식별 번호 \n 최상위 부서 : null"),

                                fieldWithPath("content[].deptLeader").type(JsonFieldType.OBJECT).description("부서장 정보"),
                                fieldWithPath("content[].deptLeader.empId").type(JsonFieldType.NUMBER).description("부서장 사원 식별번호"),
                                fieldWithPath("content[].deptLeader.empNo").type(JsonFieldType.STRING).description("부서장 사원번호"),
                                fieldWithPath("content[].deptLeader.empName").type(JsonFieldType.STRING).description("부서장 이름"),
                                fieldWithPath("content[].deptLeader.extensionNo").type(JsonFieldType.STRING).description("부서장 사무실 번호"),
                                fieldWithPath("content[].deptLeader.email").type(JsonFieldType.STRING).description("부서장 이메일주소"),
                                fieldWithPath("content[].deptLeader.position").type(JsonFieldType.STRING).description("부서장 직급"),

                                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 부서 수"),
                                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                                subsectionWithPath("pageable").ignored(),
                                subsectionWithPath("sort").ignored()
                        )
                    )
                );
    }

    @Test
    @DisplayName("특정 부서의 멤버 리스트 조회")
    void getDeptMembers() throws Exception {
        List<DeptMemberInfo> response = List.of(
                support.getDeptMemberInfo(1L, "홍길동", PositionCode.ASSISTANT_MANAGER),
                support.getDeptMemberInfo(2L, "김철수", PositionCode.STAFF),
                support.getDeptMemberInfo(3L, "박영희", PositionCode.INTERN)
        );

        Mockito.when(deptRetriever.retrieverDeptMemberList(anyLong(), anyString(), anyBoolean(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        response,
                        PageRequest.of(0, 10),
                        response.size()
                ));

        mockMvc.perform(
                get(REQUEST_MAPPING + "/{deptId}/members", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .param("keyword", " ")
                        .param("isEmpActive", "true")
                        .param("page", "0")
                        .param("size", "10")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("DEPT_MEMBERS",
                                preprocessRequest(prettyPrint()),
                                preprocessResponse(prettyPrint()),

                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),

                                pathParameters(
                                        parameterWithName("deptId").description("부서 식별 번호")
                                ),

                                queryParameters(
                                        parameterWithName("keyword").optional().description("사원 이름 검색어"),
                                        parameterWithName("isEmpActive").optional().description("활성화 사원 필터링 \n 미선택시, 모든 상태의 사원 출력"),
                                        parameterWithName("page").optional().description("페이지 번호"),
                                        parameterWithName("size").optional().description("페이지 크기")
                                ),
//
                                responseFields(
                                        fieldWithPath("content").type(JsonFieldType.ARRAY).description(" "),

                                        fieldWithPath("content[].empId").type(JsonFieldType.NUMBER).description("사원 식별번호"),
                                        fieldWithPath("content[].empNo").type(JsonFieldType.STRING).description("사원번호"),
                                        fieldWithPath("content[].empName").type(JsonFieldType.STRING).description("이름"),
                                        fieldWithPath("content[].extensionNo").type(JsonFieldType.STRING).description("사무실 번호"),
                                        fieldWithPath("content[].email").type(JsonFieldType.STRING).description("이메일주소"),
                                        fieldWithPath("content[].position").type(JsonFieldType.STRING).description("직급"),

                                        fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 멤버 수"),
                                        fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                                        fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                                        fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                                        fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                                        fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                                        fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                                        fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                                        subsectionWithPath("pageable").ignored(),
                                        subsectionWithPath("sort").ignored()
                                )
                        )
                );

    }

    @Test
    @DisplayName("부서 기본정보 조회")
    void getDeptInfo() throws Exception {
        DeptInfoResponse response = support
                .getDeptInfoResponse(1L, "IT", 1L, "김철수", PositionCode.ASSISTANT_MANAGER);

        Mockito.when(deptRetriever.retrieverDeptInfo(eq(1L)))
                .thenReturn(response);

        mockMvc.perform(
                get(REQUEST_MAPPING + "/{deptId}", 1L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer AccessToken")
        )
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andDo(document("DEPT_INFO",
                                preprocessRequest(prettyPrint()),
                                preprocessResponse(prettyPrint()),

                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),

                                pathParameters(
                                        parameterWithName("deptId").description("부서 식별 번호")
                                ),

                                responseFields(
                                        fieldWithPath("deptInfoResponse").type(JsonFieldType.OBJECT).description("부서 정보"),
                                        fieldWithPath("deptInfoResponse.deptId").type(JsonFieldType.NUMBER).description("부서 식별 번호"),
                                        fieldWithPath("deptInfoResponse.deptCode").type(JsonFieldType.STRING).description("부서 코드"),
                                        fieldWithPath("deptInfoResponse.deptName").type(JsonFieldType.STRING).description("부서명"),
                                        fieldWithPath("deptInfoResponse.isActive").type(JsonFieldType.BOOLEAN).description("부서 활성화 여부"),
                                        fieldWithPath("deptInfoResponse.parentDeptId").optional().type(JsonFieldType.NUMBER).description("상위 부서 식별 번호 \n 최상위 부서 : null"),

                                        fieldWithPath("deptLeader").type(JsonFieldType.OBJECT).description("부서장 정보"),
                                        fieldWithPath("deptLeader.empId").type(JsonFieldType.NUMBER).description("부서장 사원 식별번호"),
                                        fieldWithPath("deptLeader.empNo").type(JsonFieldType.STRING).description("부서장 사원번호"),
                                        fieldWithPath("deptLeader.empName").type(JsonFieldType.STRING).description("부서장 이름"),
                                        fieldWithPath("deptLeader.extensionNo").type(JsonFieldType.STRING).description("부서장 사무실 번호"),
                                        fieldWithPath("deptLeader.email").type(JsonFieldType.STRING).description("부서장 이메일주소"),
                                        fieldWithPath("deptLeader.position").type(JsonFieldType.STRING).description("부서장 직급")

                                )
                        )
                );
    }
}
