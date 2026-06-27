package com.haruon.groupware.adapter.webapi.employee.account;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpFileListInfo;
import com.haruon.groupware.domain.employee.Emp;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Slf4j
public class EmpMeApiTest extends IntegrationTestSupport {

    @Autowired
    private EmpQueryRepositoryAdapter empQueryRepositoryAdapter;

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
                        get("/api/employees/me")
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
                        get("/api/employees/me/files")
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
                        get("/api/employees/me/belongings")
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
                        patch("/api/employees/me")
                                .header("Authorization", "Bearer " + accessToken)
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
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
                        patch("/api/employees/me")
                                .header("Authorization", "Bearer " + accessToken)
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andReturn();
    }

    @Test
    @DisplayName("파일 활성화/비활성화 테스트")
    void activateFileTest() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        registerEmpHavingAllInfo(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        List<EmpFileListInfo> allEmpFileInfosByEmpIdList = empQueryRepositoryAdapter.findAllEmpFileInfosByEmpId(emp.getId()).orElseThrow();
        Long id = allEmpFileInfosByEmpIdList.getLast().file().fileId();    // getLast = 비활성화 파일

        mockMvc.perform(
                        patch("/api/employees/me/files/{fileId}/status", id)
                                .param("isForActivate", "true")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        EmpFileListInfo empFileListInfo1 = empQueryRepositoryAdapter.findEmpFileInfoByEmpIdAndFileId(emp.getId(), id).orElseThrow();

        log.info("empFileInfo1 = {}", empFileListInfo1);
        assertThat(empFileListInfo1.isActive()).isTrue();


        mockMvc.perform(
                        patch("/api/employees/me/files/{fileId}/status", id)
                                .param("isForActivate", "false")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        EmpFileListInfo empFileListInfo2 = empQueryRepositoryAdapter.findEmpFileInfoByEmpIdAndFileId(emp.getId(), id).orElseThrow();
        assertThat(empFileListInfo2.isActive()).isFalse();

    }

}
