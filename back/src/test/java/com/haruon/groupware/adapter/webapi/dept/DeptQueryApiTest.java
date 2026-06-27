package com.haruon.groupware.adapter.webapi.dept;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.dept.provided.forRetriever.DeptRetriever;
import com.haruon.groupware.application.employee.account.provided.forRetriever.EmpAccountRetriever;
import com.haruon.groupware.domain.employee.Emp;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class DeptQueryApiTest extends IntegrationTestSupport {

    @Autowired
    DeptRetriever deptRetriever;


    private static final String REQUEST_MAPPING = "/api/departments";
    @Autowired
    private EmpAccountRetriever empAccountRetriever;

    @Test
    @DisplayName("부서전체 조회")
    void getDepts_success() throws Exception {
        String accessToken = getAccessToken();
        registerHR("hrLogin123", "1Q@W#E$R%T");

        mockMvc.perform(
                        get(REQUEST_MAPPING)
                                .header("Authorization", BEARER + accessToken)
                                .param("isActive", "true")
                                .param("keyword", "hr")
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andExpect(jsonPath("$.content[0].deptInfoResponse.deptName").value("HR"));
    }

    @Test
    @DisplayName("특정 부서의 멤버 리스트 조회")
    void getDeptMembers_success() throws Exception {
        String accessToken = getAccessToken();

        Emp emp = getEmp();
        Long targetDeptId = empAccountRetriever.retrieveEmpBelongingsInfo(emp.getId()).getFirst().deptId();

        mockMvc.perform(
                get(REQUEST_MAPPING + "/{deptId}/members", targetDeptId)
                        .header("Authorization", BEARER + accessToken)
                        .param("keyword", emp.getEmpName())
                        .param("isActive", "true")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andExpect(jsonPath("$.content[0].empId").value(emp.getId()));
    }

    @Test
    @DisplayName("특정 부서의 정보 조회")
    void getDept_success() throws Exception {
        String accessToken = getAccessToken();

        Long targetDeptId = empAccountRetriever
                .retrieveEmpBelongingsInfo(getEmp().getId()).getFirst().deptId();

        mockMvc.perform(
                get(REQUEST_MAPPING + "/{deptId}", targetDeptId)
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deptInfoResponse").isNotEmpty())
                .andExpect(jsonPath("$.deptLeader").isNotEmpty());

    }

    private Emp getEmp() {
        String hrLogin123 = "hrLogin123";
        registerHR(hrLogin123, "1Q@W#E$R%T");
        return empRepository.findByLoginId(hrLogin123).orElseThrow();
    }

    private String getAccessToken() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);
        return loginByIdAndPw(loginId, password);
    }



}
