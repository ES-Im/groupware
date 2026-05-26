package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.IntegrityTestFixtures;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
class EmpAccountApiTest extends IntegrationTestSupport {

    @Autowired
    private EmpQueryRepositoryAdapter empQueryRepositoryAdapter;

    @Test
    @DisplayName("회원가입 성공 테스트")
    void register_success() throws Exception {
        EmpRegisterRequest request = new EmpRegisterRequest("202601999", "홍길동", "login12345", "!Q2w3e4r5t");

        mockMvc.perform(
                post("/api/emp")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(status().isOk());
    }

    @Test
    @DisplayName("회원가입 실패 테스트")
    void register_fail() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        loginByIdAndPw(loginId, password);

        EmpRegisterRequest request = new EmpRegisterRequest("202601999", "홍길동", loginId, password);

        mockMvc.perform(
                post("/api/emp")
                        .content(objectMapper.writeValueAsBytes(request))
                        .contentType(MediaType.APPLICATION_JSON)
        ).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("개인정보 조회 테스트")
    void retriever_me_info_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        log.info("accessToken : {}", accessToken);
        log.info("개인정보조회 시작");
        MvcResult result = mockMvc.perform(
                        get("/api/emp/me")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("empBasicInfo");
        assertThat(result.getResponse().getContentAsString()).contains("activeFiles");
        assertThat(result.getResponse().getContentAsString()).contains("currentDepts");
    }

    @Test
    @DisplayName("개인 프로필/전자서명 이미지 모두 조회")
    void meFiles_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        MvcResult result = mockMvc.perform(
                        get("/api/emp/me/files")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("fileId");
    }

    @Test
    @DisplayName("개인 프로필/전자서명 이미지 모두 조회")
    void belongings_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        MvcResult result = mockMvc.perform(
                        get("/api/emp/me/belongings")
                                .header("Authorization", "Bearer " + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("positionName");
    }

    @Test
    @DisplayName("개인정보 변경 테스트")
    void update_me_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        EmpUpdateRequestBySelf request = EmpUpdateRequestBySelf.builder()
                .extensionNo("111-1111").newRawPassword("!newPassword123").build();

        mockMvc.perform(
                        patch("/api/emp/me")
                                .header("Authorization", "Bearer " + accessToken)
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    @DisplayName("개인정보 변경 테스트")
    void update_me_fail() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        EmpUpdateRequestBySelf request = EmpUpdateRequestBySelf.builder()
                .extensionNo("111-1111").newRawPassword("!newPassword123").build();

        mockMvc.perform(
                        patch("/api/emp/me")
                                .header("Authorization", "Bearer " + accessToken)
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    @DisplayName("파일 추가 테스트")
    void addMeFileTest() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        MockMultipartFile file = new MockMultipartFile("file", "profile.png", "image/png", new byte[]{1});

        mockMvc.perform(
                        multipart("/api/emp/me/files")
                                .file(file)
                                .param("fileType", FileType.PROFILE_PICTURE.name())
                                .header("Authorization", "Bearer " + accessToken)
                                .with(req -> {
                                    req.setMethod("PATCH");

                                    return req;
                                })
                                .contentType(MediaType.MULTIPART_FORM_DATA)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("파일 활성화/비활성화 테스트")
    void activateFileTest() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        List<EmpFileInfo> allEmpFileInfosByEmpId = empQueryRepositoryAdapter.findAllEmpFileInfosByEmpId(emp.getId()).orElseThrow();
        Long id = allEmpFileInfosByEmpId.getLast().fileId();    // getLast = 비활성화 파일

        mockMvc.perform(
                        patch("/api/emp/me/files/{fileId}/status", id)
                                .param("isForActivate", "true")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        EmpFileInfo empFileInfo1 = empQueryRepositoryAdapter.findEmpFileInfoByEmpIdAndFileId(emp.getId(), id).orElseThrow();

        log.info("empFileInfo1 = {}", empFileInfo1);
        assertThat(empFileInfo1.isActive()).isTrue();


        mockMvc.perform(
                        patch("/api/emp/me/files/{fileId}/status", id)
                                .param("isForActivate", "false")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        EmpFileInfo empFileInfo2 = empQueryRepositoryAdapter.findEmpFileInfoByEmpIdAndFileId(emp.getId(), id).orElseThrow();
        assertThat(empFileInfo2.isActive()).isFalse();

    }

    @Test
    @DisplayName("파일 삭제 테스트")
    void deleteFileTest() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        List<EmpFileInfo> allEmpFileInfosByEmpId = empQueryRepositoryAdapter.findAllEmpFileInfosByEmpId(emp.getId()).orElseThrow();
        Long id = allEmpFileInfosByEmpId.getLast().fileId();

        mockMvc.perform(
                        delete("/api/emp/me/files/{fileId}", id)
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        EmpFileInfo empFileInfo = empQueryRepositoryAdapter.findEmpFileInfoByEmpIdAndFileId(emp.getId(), id).orElse(null);

        assertThat(empFileInfo).isNull();
    }
    
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
                get("/api/emp")
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
                        get("/api/emp")
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
                        get("/api/emp")
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
                        get("/api/emp/new")
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
                        get("/api/emp/new")
                                .header("Authorization", "Bearer " + accessToken)
                                .param("keyword", "t")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized());
    }


    private void registerEmp(String loginId, String password) {
        IntegrityTestFixtures.registeredEmp(
                empRepository, encoder, loginId, password
        );
    }


    private void registerHR(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingWithHrRole(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    private void registerDeptManager(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingWithManagerRole(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    private void registerEmpHavingAllInfo(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingAllInfo(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    private String loginByIdAndPw(String loginId, String password) throws Exception {
        return IntegrityTestFixtures.getAccessToken(
                empRepository, encoder, mockMvc, objectMapper, loginId, password
        );
    }


}
