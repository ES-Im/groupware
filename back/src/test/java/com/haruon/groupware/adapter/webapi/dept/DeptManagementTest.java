package com.haruon.groupware.adapter.webapi.dept;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.dept.deptService.dto.request.DeptRegisterRequest;
import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.provided.DeptManagement;
import com.haruon.groupware.application.dept.provided.DeptRetriever;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.BelongingInfo;
import com.haruon.groupware.domain.empInfo.Dept;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;

import static com.haruon.groupware.adapter.IntegrityTestFixtures.getDeptForFixture;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DeptManagementTest extends IntegrationTestSupport {

    private final String REQUEST_MAPPING_URL = "/api/departments";
    @Autowired
    private EmpAccountRetriever empAccountRetriever;
    @Autowired
    private DeptRetriever deptRetriever;
    @Autowired
    private DeptManagement deptManagement;

    @Test
    @DisplayName("부서 생성 테슽")
    void register_dept_test() throws Exception {
        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        DeptRegisterRequest request = DeptRegisterRequest.builder()
                .deptCode("010").deptName("FRANCHISE").build();

        mockMvc.perform(
                post(REQUEST_MAPPING_URL)
                        .header("Authorization", BEARER+ accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("부서 활성화")
    void activateDept_test() throws Exception {
        Dept it = getDeptForFixture(deptRepository, "999", "IT");
        it.deactivate();
        deptRepository.save(it);

        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/activation", it.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());
        Dept target = deptRepository.findById(it.getId()).orElseThrow();
        assertTrue(target.isActive());
    }

    @Test
    @DisplayName("부서 비활성화")
    void deactivateDept_test() throws Exception {
        Dept it = getDeptForFixture(deptRepository, "999", "IT");

        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/deactivation", it.getId())
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Dept target = deptRepository.findById(it.getId()).orElseThrow();
        assertFalse(target.isActive());
    }

    @Test
    @DisplayName("부서명 변경")
    void rename_deptName_test() throws Exception{
        Dept targetDept = getDeptForFixture(deptRepository, "999", "IT");

        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        String newName = "newName";
        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/name", targetDept.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("newName", newName)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Dept target = deptRepository.findById(targetDept.getId()).orElseThrow();
        assertEquals(newName, target.getDeptName());
    }

    @Test
    @DisplayName("부서명 변경")
    void change_parent_dept() throws Exception {
        Dept targetDept = getDeptForFixture(deptRepository, "999", "IT");
        Dept parentDept = getDeptForFixture(deptRepository, "998", "PARENT_DEPT");

        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/parent", targetDept.getId())
                        .header("Authorization", BEARER + accessToken)
                        .param("parentDeptId", parentDept.getId() + "")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Dept parent = deptRepository.findById(parentDept.getId()).orElseThrow();
        Dept target = deptRepository.findById(targetDept.getId()).orElseThrow();
        assertEquals(parent, target.getParentDept());
    }

    @Test
    @DisplayName("부서장 임명")
    void appoint_leader_test() throws Exception {
        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        String targetEmpLoginId = "emp1234";
        registerHR(targetEmpLoginId, "!Q2w3e4r5t");
        Long targetEmpid = empRepository.findByLoginId(targetEmpLoginId).orElseThrow().getId();
        BelongingInfo first = empAccountRetriever.retrieveEmpBelongingsInfo(targetEmpid).getFirst();
        Long targetDeptId = first.deptId();

        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/leader/appointment", targetDeptId)
                        .header("Authorization", BEARER + accessToken)
                        .param("leaderEmpId", targetEmpid + "")
                        .param("appointedAt", "2026-03-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        DeptInfoResponse deptInfoResponse = deptRetriever.retrieverDeptInfo(targetDeptId);
        assertEquals(targetEmpid, deptInfoResponse.deptLeader().empId());

    }

    @Test
    @DisplayName("부서장 직위 해제")
    void end_appoint_leader_test() throws Exception {
        String loginId = "adminLoginId123";
        String accessToken = adminAccessToken(loginId, "!Q2w3e4r5t");

        String targetEmpLoginId = "emp1234";
        registerHR(targetEmpLoginId, "!Q2w3e4r5t");
        Long targetEmpid = empRepository.findByLoginId(targetEmpLoginId).orElseThrow().getId();
        BelongingInfo empBelongings = empAccountRetriever.retrieveEmpBelongingsInfo(targetEmpid).getFirst();
        Long targetDeptId = empBelongings.deptId();
        deptManagement.appointLeader(targetDeptId, targetEmpid, LocalDate.of(2026,3,1), empRepository.findByLoginId(loginId).orElseThrow().getId());

        mockMvc.perform(
                patch(REQUEST_MAPPING_URL + "/{deptId}/leader/end", targetDeptId)
                        .header("Authorization", BEARER + accessToken)
                        .param("endAt", "2026-04-01")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        DeptInfoResponse deptInfoResponse = deptRetriever.retrieverDeptInfo(targetDeptId);
        assertNotEquals(targetEmpid, deptInfoResponse.deptLeader().empId());

    }

    private String adminAccessToken(String loginId, String pw) throws Exception {
        registerAdmin(loginId, pw);

        return loginByIdAndPw(loginId, pw);
    }




}
