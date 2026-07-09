package com.haruon.groupware.adapter.webapi.employee.leave;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.EmpLeave;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveEmpWithDept;
import static com.haruon.groupware.domain.employee.EmpLeave.createEmpLeave;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class EmployeeLeaveQueryApiTest extends IntegrationTestSupport {

    private static final int TARGET_YEAR = 2026;
    private static final String PASSWORD = "!Q2w3e4r5t";

    @Test
    @DisplayName("내 잔여 휴가 요약 조회 - 본인의 연차 정보를 조회한다")
    void myLeaveSummary_success() throws Exception {
        String loginId = "employee12345";
        activatedEmp(loginId, PASSWORD);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();
        saveLeave(emp, 15.0, 2.0, 1.0, 0.5, 3.0, 1.0);

        String accessToken = loginByIdAndPw(loginId, PASSWORD);

        mockMvc.perform(
                        get("/api/employees/me/leaves/summary")
                                .header("Authorization", BEARER + accessToken)
                                .param("year", String.valueOf(TARGET_YEAR))
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.annualBaseGrantDays").value(15.0))
                .andExpect(jsonPath("$.annualUsedDays").value(2.0))
                .andExpect(jsonPath("$.specialGrantDays").value(1.0))
                .andExpect(jsonPath("$.specialUsedDays").value(0.5))
                .andExpect(jsonPath("$.compensatoryGrantDays").value(3.0))
                .andExpect(jsonPath("$.compensatoryUsedDays").value(1.0));
    }

    @Test
    @DisplayName("관리자 사원 휴가 요약 조회 - 전체 사원의 연차 목록을 조회한다")
    void leaveSummary_byAdmin_success() throws Exception {
        String adminLoginId = "admin12345";
        registerAdmin(adminLoginId, PASSWORD);
        Dept dept = getDept("001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601010", "targetEmp", dept);
        saveLeave(targetEmp, 15.0, 3.0, 2.0, 0.0, 1.0, 0.0);

        String accessToken = loginByIdAndPw(adminLoginId, PASSWORD);

        mockMvc.perform(
                        get("/api/employees/leaves/summary")
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "Test")
                                .param("year", String.valueOf(TARGET_YEAR))
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].empId").value(targetEmp.getId()))
                .andExpect(jsonPath("$.content[0].empNo").value("202601010"))
                .andExpect(jsonPath("$.content[0].empName").value("Test"))
                .andExpect(jsonPath("$.content[0].deptName").value("HR"))
                .andExpect(jsonPath("$.content[0].leaveSummary.annualBaseGrantDays").value(15.0))
                .andExpect(jsonPath("$.content[0].leaveSummary.annualUsedDays").value(3.0))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("관리자 회사 휴가 사용률 조회 - 전체 사원의 연차 사용률을 조회한다")
    void leaveUsageSummary_byAdmin_success() throws Exception {
        String adminLoginId = "admin12345";
        registerAdmin(adminLoginId, PASSWORD);

        Emp firstEmp = saveEmpWithDept(empRepository, deptRepository, "202601011", "firstEmp", getDept("001", "HR"));
        Emp secondEmp = saveEmpWithDept(empRepository, deptRepository, "202601012", "secondEmp", getDept("002", "IT"));
        saveLeave(firstEmp, 10.0, 2.0, 0.0, 0.0, 0.0, 0.0);
        saveLeave(secondEmp, 10.0, 3.0, 0.0, 0.0, 0.0, 0.0);

        String accessToken = loginByIdAndPw(adminLoginId, PASSWORD);

        mockMvc.perform(
                        get("/api/employees/leaves/usage-summary")
                                .header("Authorization", BEARER + accessToken)
                                .param("year", String.valueOf(TARGET_YEAR))
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.annualLeaveUsagePercent").value(25.0));
    }

    @Test
    @DisplayName("부서 휴가 요약 조회 - 부서매니저는 같은 부서원의 연차 목록을 조회한다")
    void deptLeaveSummary_byDeptManager_success() throws Exception {
        Dept dept = getDept("001", "HR");
        String managerLoginId = "manager12345";
        registerDeptManager(managerLoginId, PASSWORD, dept);
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601013", "targetEmp", dept);
        saveLeave(targetEmp, 12.0, 4.0, 1.0, 0.0, 2.0, 0.0);

        Emp otherEmp = saveEmpWithDept(empRepository, deptRepository, "202601014", "otherEmp", getDept("002", "IT"));
        saveLeave(otherEmp, 12.0, 1.0, 0.0, 0.0, 0.0, 0.0);

        String accessToken = loginByIdAndPw(managerLoginId, PASSWORD);

        mockMvc.perform(
                        get("/api/departments/{deptId}/employees/leaves/summary", dept.getId())
                                .header("Authorization", BEARER + accessToken)
                                .param("keyword", "Test")
                                .param("year", String.valueOf(TARGET_YEAR))
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].empId").value(targetEmp.getId()))
                .andExpect(jsonPath("$.content[0].empNo").value("202601013"))
                .andExpect(jsonPath("$.content[0].deptName").value("HR"))
                .andExpect(jsonPath("$.content[0].leaveSummary.annualUsedDays").value(4.0))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("부서 휴가 사용률 조회 - 부서매니저는 같은 부서의 연차 사용률을 조회한다")
    void deptLeaveUsageSummary_byDeptManager_success() throws Exception {
        Dept dept = getDept("001", "HR");
        String managerLoginId = "manager12345";
        registerDeptManager(managerLoginId, PASSWORD, dept);
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601015", "targetEmp", dept);
        saveLeave(targetEmp, 10.0, 2.0, 0.0, 0.0, 0.0, 0.0);

        Emp otherEmp = saveEmpWithDept(empRepository, deptRepository, "202601016", "otherEmp", getDept("002", "IT"));
        saveLeave(otherEmp, 10.0, 8.0, 0.0, 0.0, 0.0, 0.0);

        String accessToken = loginByIdAndPw(managerLoginId, PASSWORD);

        mockMvc.perform(
                        get("/api/departments/{deptId}/employees/leaves/usage-summary", dept.getId())
                                .header("Authorization", BEARER + accessToken)
                                .param("year", String.valueOf(TARGET_YEAR))
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.annualLeaveUsagePercent").value(20.0));
    }

    @Test
    @DisplayName("관리자는 특정 사원의 특휴/포상휴가 부여일수를 조정한다")
    void adjustGrantDays_byAdmin_success() throws Exception {
        String adminLoginId = "admin12345";
        registerAdmin(adminLoginId, PASSWORD);
        String targetLoginId = "employee12345";
        activatedEmp(targetLoginId, PASSWORD);
        Emp targetEmp = empRepository.findByLoginId(targetLoginId).orElseThrow();
        saveLeave(targetEmp, 15.0, 0.0, 0.0, 0.0, 0.0, 0.0);

        String accessToken = loginByIdAndPw(adminLoginId, PASSWORD);

        mockMvc.perform(
                        patch("/api/employees/{empId}/leaves/special-grant-days", targetEmp.getId())
                                .header("Authorization", BEARER + accessToken)
                                .param("plusMinusDays", "2.5")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        mockMvc.perform(
                        patch("/api/employees/{empId}/leaves/compensatory-grant-days", targetEmp.getId())
                                .header("Authorization", BEARER + accessToken)
                                .param("plusMinusDays", "1.5")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        EmpLeave foundLeave = empLeaveRepository
                .findByEmpIdAndGrantYear(targetEmp.getId(), TARGET_YEAR)
                .orElseThrow();
        assertThat(foundLeave.getSpecialGrantDays()).isEqualTo(2.5);
        assertThat(foundLeave.getCompensatoryGrantDays()).isEqualTo(1.5);
    }

    private EmpLeave saveLeave(
            Emp emp,
            double annualGrantDays,
            double annualUsedDays,
            double specialGrantDays,
            double specialUsedDays,
            double compensatoryGrantDays,
            double compensatoryUsedDays
    ) {
        EmpLeave empLeave = createEmpLeave(emp, TARGET_YEAR, annualGrantDays);
        if (annualUsedDays > 0) empLeave.useAnnualDays(annualUsedDays);
        if (specialGrantDays > 0) empLeave.adjustSpecialGrantDays(specialGrantDays);
        if (specialUsedDays > 0) empLeave.useSpecialDays(specialUsedDays);
        if (compensatoryGrantDays > 0) empLeave.adjustCompensatoryGrantDays(compensatoryGrantDays);
        if (compensatoryUsedDays > 0) empLeave.useCompensatoryDays(compensatoryUsedDays);

        return empLeaveRepository.save(empLeave);
    }
}
