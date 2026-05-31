package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.domain.empInfo.Emp;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
class EmpManagementApiTest extends IntegrationTestSupport {

    @Autowired
    private EmpQueryRepositoryAdapter empQueryRepositoryAdapter;

    @Test
    @DisplayName("사원 관리용 사원리스트 조회 - SystemRole = HR은 모든 부서를 조회할 수 있다.")
    void empsForManagementByHR() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerHR(loginId, password);
        registerEmpHavingAllInfo("login12346", "!Q2w3e4r5t");
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();
        Emp emp2 = empRepository.findByLoginId("login12346").orElseThrow();

        String accessToken = loginByIdAndPw(loginId, password);

        EmpInfoResponse otherDeptEmp = empQueryRepositoryAdapter.findEmpInfoByEmpId(emp2.getId()).orElse(null);
        Long id = otherDeptEmp.currentDepts().getFirst().deptId();

        mockMvc.perform(
                get("/api/employees")
                        .header("Authorization", "Bearer " + accessToken)
                        .param("deptId", id+"")
                        .param("status", "ACTIVE")
                        .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andExpect(jsonPath("$.content[0].loginId").value("login12346"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();
    }

    @Test
    @DisplayName("사원 관리용 사원리스트 조회 - SystemRole = Dept Manager는 해당 사원이 속한 부서만 조회할 수 있다.")
    void empsForManagementByManager() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerDeptManager(loginId, password);
        registerEmpHavingAllInfo("login12346", "!Q2w3e4r5t");

        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String accessToken = loginByIdAndPw(loginId, password);

        EmpInfoResponse otherDeptEmp = empQueryRepositoryAdapter.findEmpInfoByEmpId(emp.getId()).orElse(null);
        Long id = otherDeptEmp.currentDepts().getFirst().deptId();

        mockMvc.perform(
                        get("/api/employees")
                                .header("Authorization", "Bearer " + accessToken)
                                .param("deptId", id+"")
                                .param("status", "ACTIVE")
                                .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andExpect(jsonPath("$.content[0].loginId").value("login12346"))
                .andReturn();
    }

    @Test
    @DisplayName("사원 관리용 사원리스트 조회 - SystemRole = Dept Manager는 해당 사원이 속한 부서는 조회할 수 없다.")
    void empsForManagementByManager_fail() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerDeptManager(loginId, password);

        registerHR("login12346", "!Q2w3e4r5t");

        Emp otherDeptMember = empRepository.findByLoginId("login12346").orElseThrow();
        String accessToken = loginByIdAndPw(loginId, password);

        EmpInfoResponse otherDeptEmp = empQueryRepositoryAdapter.findEmpInfoByEmpId(otherDeptMember.getId()).orElse(null);
        Long id = otherDeptEmp.currentDepts().getFirst().deptId();

        mockMvc.perform(
                        get("/api/employees")
                                .header("Authorization", "Bearer " + accessToken)
                                .param("deptId", id+"")
                                .param("status", "ACTIVE")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();
    }

    @Test
    @DisplayName("신규사원 관리용 사원리스트 조회 - SystemRole = HR은 신규사원(status = PENDING)을 조회할 수 있다")
    void newEmpsForManagementByHR() throws Exception {
        String HRLoginId = "login12345";
        String HRPassword = "!Q2w3e4r5t";
        registerHR(HRLoginId, HRPassword);
        String newMemberLoginId = "login12346";
        registerEmp(newMemberLoginId, "!Q2w3e4r5t");

        String accessToken = loginByIdAndPw(HRLoginId, HRPassword);
        log.info("accessToken = {}", accessToken);
        mockMvc.perform(
                        get("/api/employees/new")
                                .header("Authorization", "Bearer " + accessToken)
                                .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andExpect(jsonPath("$.content[0].loginId").value(newMemberLoginId))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();
    }

    @Test
    @DisplayName("신규사원 관리용 사원리스트 조회 - SystemRole = HR이 아니라면 신규사원(status = PENDING)을 조회할 수 없다")
    void newEmpsForManagementByNotHR_fail() throws Exception {
        String managerLoginId = "login12345";
        String managerPw = "!Q2w3e4r5t";
        registerDeptManager(managerLoginId, managerPw);
        String newMemberLoginId = "login12346";
        registerEmp(newMemberLoginId, "!Q2w3e4r5t");

        String accessToken = loginByIdAndPw(managerLoginId, managerPw);

        mockMvc.perform(
                        get("/api/employees/new")
                                .header("Authorization", "Bearer " + accessToken)
                                .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized());
    }






}
