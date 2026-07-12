package com.haruon.groupware.adapter.webapi.employee.account;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpUpdateRequestByDeptManager;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpUpdateRequestByHR;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpFileListInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpInfoResponse;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

import static com.haruon.groupware.adapter.IntegrityTestFixtures.getEmpHavingAllInfo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
                        .header("Authorization", BEARER + accessToken)
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
        registerDeptManager(loginId, password, getDept("002", "IT"));
        registerEmpHavingAllInfo("login12346", "!Q2w3e4r5t");

        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String accessToken = loginByIdAndPw(loginId, password);

        EmpInfoResponse otherDeptEmp = empQueryRepositoryAdapter.findEmpInfoByEmpId(emp.getId()).orElse(null);
        Long id = otherDeptEmp.currentDepts().getFirst().deptId();

        mockMvc.perform(
                        get("/api/employees")
                                .header("Authorization", BEARER + accessToken)
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
        registerDeptManager(loginId, password, getDept("002", "IT"));

        registerHR("login12346", "!Q2w3e4r5t");

        Emp otherDeptMember = empRepository.findByLoginId("login12346").orElseThrow();
        String accessToken = loginByIdAndPw(loginId, password);

        EmpInfoResponse otherDeptEmp = empQueryRepositoryAdapter.findEmpInfoByEmpId(otherDeptMember.getId()).orElse(null);
        Long id = otherDeptEmp.currentDepts().getFirst().deptId();

        mockMvc.perform(
                        get("/api/employees")
                                .header("Authorization", BEARER + accessToken)
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
        String accessToken = getHrAccessToken();

        String newMemberLoginId = "login12346";
        registerEmp(newMemberLoginId, "!Q2w3e4r5t");

        log.info("accessToken = {}", accessToken);
        mockMvc.perform(
                        get("/api/employees/new")
                                .header("Authorization", BEARER + accessToken)
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
        String accessToken = getDeptManagerAccessToken(getDept("002", "IT"));

        String newMemberLoginId = "login12346";
        registerEmp(newMemberLoginId, "!Q2w3e4r5t");


        mockMvc.perform(
                        get("/api/employees/new")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isForbidden());
    }




    @Test
    @DisplayName("회원가입 사원 가입승인 - SystemRole=HR이라면 신규사원 등록을 승인할 수 있다")
    void approve_registration() throws Exception {
        String accessToken = getHrAccessToken();

        String newMemberLoginId = "login12346";
        registerEmp(newMemberLoginId, "!Q2w3e4r5t");
        Long newMemberId = empRepository.findByLoginId(newMemberLoginId).orElseThrow().getId();


        mockMvc.perform(
                patch("/api/employees/{empId}/registration-approval", newMemberId)
                        .header("Authorization", BEARER + accessToken)
                        .param("hiredAt", "2026-01-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp emp = empRepository.findById(newMemberId).orElseThrow();
        assertEquals(emp.getStatus(), EmpStatus.ACTIVE);
        assertEquals(emp.getHiredAt(), LocalDate.of(2026, 1, 1));
    }

    @Test
    @DisplayName("사원 퇴직 처리 - HR role 권한")
    void resignation_emp_success() throws Exception {
        String accessToken = getHrAccessToken();

        String resignedEmpLoginId = "login12346";
        activatedEmp(resignedEmpLoginId, "!Q2w3e4r5t");
        Long resignedEmpId = empRepository.findByLoginId(resignedEmpLoginId).orElseThrow().getId();


        mockMvc.perform(
                patch("/api/employees/{empId}/resignation", resignedEmpId)
                        .header("Authorization", BEARER + accessToken)
                        .param("hiredAt", "2026-02-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp emp = empRepository.findById(resignedEmpId).orElseThrow();
        assertEquals(emp.getStatus(), EmpStatus.RESIGNED);
        assertEquals(emp.getResignedAt(), LocalDate.of(2026, 2, 1));
    }

    @Test
    @DisplayName("사원 재활성화 - HR role 권한")
    void activate_emp_success() throws Exception {
        String accessToken = getHrAccessToken();

        String suspendEmpLoginId = "login12346";
        suspendedEmp(suspendEmpLoginId, "!Q2w3e4r5t");
        Long suspendEmpId = empRepository.findByLoginId(suspendEmpLoginId).orElseThrow().getId();


        mockMvc.perform(
                patch("/api/employees/{empId}/status/activation", suspendEmpId)
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp emp = empRepository.findById(suspendEmpId).orElseThrow();
        assertEquals(emp.getStatus(), EmpStatus.ACTIVE);
    }
    
    @Test
    @DisplayName("사원 정직처분 - HR role 권한")
    void suspend_emp() throws Exception {
        String accessToken = getHrAccessToken();

        String activatedEmpLoginId = "login12346";
        activatedEmp(activatedEmpLoginId, "!Q2w3e4r5t");
        Long targetEmpId = empRepository.findByLoginId(activatedEmpLoginId).orElseThrow().getId();

        mockMvc.perform(
                patch("/api/employees/{empId}/status/suspension", targetEmpId)
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp emp = empRepository.findById(targetEmpId).orElseThrow();
        assertEquals(emp.getStatus(), EmpStatus.SUSPENDED);
    }

    @Test
    @DisplayName("특정 사원의 특정 사원 파일(전자서명 or 프로필 사진) 비활성화 - HR role 권한")
    void update_empFile_status_by_hr() throws Exception {
        String accessToken = getHrAccessToken();

        String targetEmpLoginId = "login12346";
        getEmpHavingAllInfos(targetEmpLoginId);
        Emp targetEmp = empRepository.findByLoginId(targetEmpLoginId).orElseThrow();

        Long targetFileId = getOnesFileId(targetEmp.getId());

        mockMvc.perform(
                patch("/api/employees/{empId}/files/{fileId}/status", targetEmp.getId(), targetFileId)
                        .header("Authorization", BEARER + accessToken)
                        .param("isForActivate", "false")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        EmpFileListInfo empFileListInfo = empQueryRepository.findEmpFileInfoByEmpIdAndFileId(targetEmp.getId(), targetFileId).orElseThrow();

        assertFalse(empFileListInfo.isActive());
    }

    @Test
    @Transactional
    @DisplayName("HR롤 전용 특정 사원 기본정보 수정")
    void update_emp() throws Exception {
        String accessToken = getHrAccessToken();

        String targetEmpLoginId = "login12346";
        getEmpHavingAllInfos(targetEmpLoginId);
        Emp targetEmp = empRepository.findByLoginId(targetEmpLoginId).orElseThrow();

        String newEmployeeName = "새로운 이름";
        String newPassword = "new!Q2w3e4r5t";
        String newExtensionNo = "111-1234";
        Set<SystemRoleCode> newSystemRole = Set.of(SystemRoleCode.FRANCHISE, SystemRoleCode.EMPLOYEE);
        LocalDate newHireAt = LocalDate.of(2024, 1, 1);
        EmpUpdateRequestByHR request = EmpUpdateRequestByHR.builder()
                        .empName(newEmployeeName)
                        .password(newPassword)
                        .extensionNo(newExtensionNo)
                        .systemRoleCode(newSystemRole)
                        .hireAt(newHireAt)
                        .build();

        mockMvc.perform(
                patch("/api/employees/{empId}/hr-managed-info", targetEmp.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp updatedEmp = empRepository.findById(targetEmp.getId()).orElseThrow();
        assertThat(updatedEmp.getEmpName()).isEqualTo(newEmployeeName);
        assertThat(encoder.matches(newPassword, updatedEmp.getEmpPassword())).isTrue();
        assertThat(updatedEmp.getExtensionNo()).isEqualTo(newExtensionNo);
        assertThat(updatedEmp.getHiredAt()).isEqualTo(newHireAt);

        var updatedEmpInfo = empQueryRepositoryAdapter
                .findEmpInfoList(null, null, newEmployeeName, PageRequest.of(0, 10))
                .getContent()
                .getFirst();
        assertThat(updatedEmpInfo.systemRoleCodeName()).containsExactlyInAnyOrderElementsOf(newSystemRole);
    }

    @Test
    @Transactional
    @DisplayName("HR롤은 특정 사원에게 ADMIN 권한을 부여할 수 없다")
    void update_emp_by_hr_with_admin_role_fail() throws Exception {
        String accessToken = getHrAccessToken();

        String targetEmpLoginId = "login12346";
        getEmpHavingAllInfos(targetEmpLoginId);
        Emp targetEmp = empRepository.findByLoginId(targetEmpLoginId).orElseThrow();

        EmpUpdateRequestByHR request = EmpUpdateRequestByHR.builder()
                .systemRoleCode(Set.of(SystemRoleCode.ADMIN, SystemRoleCode.EMPLOYEE))
                .build();

        mockMvc.perform(
                patch("/api/employees/{empId}/hr-managed-info", targetEmp.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional
    @DisplayName("ADMIN롤은 특정 사원에게 ADMIN 권한을 부여할 수 있다")
    void update_emp_by_admin_with_admin_role_success() throws Exception {
        String accessToken = getAdminAccessToken();

        String targetEmpLoginId = "login12346";
        getEmpHavingAllInfos(targetEmpLoginId);
        Emp targetEmp = empRepository.findByLoginId(targetEmpLoginId).orElseThrow();
        Set<SystemRoleCode> newSystemRole = Set.of(SystemRoleCode.ADMIN, SystemRoleCode.HR, SystemRoleCode.EMPLOYEE);

        EmpUpdateRequestByHR request = EmpUpdateRequestByHR.builder()
                .systemRoleCode(newSystemRole)
                .build();

        mockMvc.perform(
                patch("/api/employees/{empId}/hr-managed-info", targetEmp.getId())
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Emp updatedEmp = empRepository.findById(targetEmp.getId()).orElseThrow();
        assertThat(updatedEmp.getSystemRoles()).containsExactlyInAnyOrderElementsOf(newSystemRole);
    }
    
    @Test
    @Transactional
    @DisplayName("같은 부서 매니저(Dept_manager) 전용 특정 사원 정보 변경")
    void update_emp_by_deptManager() throws Exception {

        String targetEmpLoginId = "login12346";
        getEmpHavingAllInfos(targetEmpLoginId);
        Emp targetEmp = empRepository.findByLoginId(targetEmpLoginId).orElseThrow();
        Dept targetEmpDept = deptRepository.findByDeptCode(
                    empQueryRepository.findAllEmpBelongingInfosByEmpId(targetEmp.getId())
                                .orElseThrow().getFirst().deptCode()
                ).orElseThrow();

        String deptManagerAccessToken = getDeptManagerAccessToken(targetEmpDept);

        String newExtensionNo = "111-1234";
        Set<SystemRoleCode> newSystemRole = Set.of(SystemRoleCode.DEPT_MANAGER, SystemRoleCode.EMPLOYEE);
        EmpUpdateRequestByDeptManager request = EmpUpdateRequestByDeptManager.builder()
                .systemRoleCode(newSystemRole).extensionNo(newExtensionNo).build();

        mockMvc.perform(
                patch("/api/employees/{empId}/dept-managed-info", targetEmp.getId())
                        .header("Authorization", BEARER + deptManagerAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());


        var updatedEmpInfo = empQueryRepositoryAdapter
                .findEmpInfoList(null, null, targetEmp.getEmpName(), PageRequest.of(0, 10))
                .getContent()
                .getFirst();
        assertThat(updatedEmpInfo.systemRoleCodeName()).containsExactlyInAnyOrderElementsOf(newSystemRole);
        assertThat(updatedEmpInfo.extensionNo()).isEqualTo(newExtensionNo);
    }





    private Long getOnesFileId(Long targetEmpId) {
        return empQueryRepository
                .findAllEmpFileInfosByEmpId(targetEmpId)
                .orElseThrow()
                .getFirst()
                .file().fileId();
    }

    private void getEmpHavingAllInfos(String loginId) {
        getEmpHavingAllInfo(
                empRepository, deptRepository, encoder, loginId, "!Q2w3e4r5t");
    }


    private String getHrAccessToken() throws Exception {
        String HRLoginId = "login12345";
        String HRPassword = "!Q2w3e4r5t";
        registerHR(HRLoginId, HRPassword);

        return getAccessToken(HRLoginId, HRPassword);
    }

    private String getAdminAccessToken() throws Exception {
        String adminLoginId = "adminLogin123";
        String adminPassword = "!Q2w3e4r5t";
        registerAdmin(adminLoginId, adminPassword);

        return getAccessToken(adminLoginId, adminPassword);
    }

    private String getDeptManagerAccessToken(Dept dept) throws Exception {
        String managerLoginId = "login12345";
        String managerPw = "!Q2w3e4r5t";
        registerDeptManager(managerLoginId, managerPw, dept);

        return loginByIdAndPw(managerLoginId, managerPw);
    }

    private String getAccessToken(String HRLoginId, String HRPassword) throws Exception {
        return loginByIdAndPw(HRLoginId, HRPassword);
    }
}
