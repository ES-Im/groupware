package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.IntegrityTestFixtures;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
class FileApiTest extends IntegrationTestSupport {

    @Autowired
    EmpQueryRepositoryAdapter empQueryRepositoryAdapter;

    @Test
    @DisplayName("사원 파일 미리보기")
    void preview_success() throws Exception {
        String loginId = "test12345";
        String password = "!Q2w3e4r5t";

        getEmpHavingFiles(loginId, password);
        String accessToken = login(loginId, password);

        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        FileListInfo file = empQueryRepositoryAdapter.findAllEmpFileInfosByEmpId(emp.getId())
                .orElseThrow()
                .stream()
                .filter(f -> f.type().equals(FileType.PROFILE_PICTURE))
                .findFirst().orElseThrow().file();

        Long fileId = file.fileId();
        String originalName = file.originalName();
        log.info("originalName = {}", originalName);

        mockMvc.perform(
                        get("/api/files/employees/{fileId}/preview", fileId)
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("image/jpeg")))
                .andExpect(content().string(containsString("profilePicture content")))
                .andDo(MockMvcResultHandlers.print());
    }

    @Test
    @DisplayName("사원 파일 다운로드 테스트")
    void download_success() throws Exception {
        String loginId = "test12345";
        String password = "!Q2w3e4r5t";

        getEmpHavingFiles(loginId, password);
        String accessToken = login(loginId, password);

        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        Long fileId = empQueryRepositoryAdapter.findAllEmpFileInfosByEmpId(emp.getId())
                .orElseThrow()
                .stream()
                .filter(f -> f.type().equals(FileType.PROFILE_PICTURE))
                .findFirst().orElseThrow().file().fileId();

        mockMvc.perform(
                        get("/api/files/employees/{fileId}/download", fileId)
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("image/jpeg")))
                .andExpect(content().string(containsString("profilePicture content")))
                .andDo(MockMvcResultHandlers.print());
    }

    private void getEmpHavingFiles(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingAllInfo(empRepository, deptRepository, encoder, empAccountManager, loginId, password);
    }

    private String login(String loginId, String password) throws Exception {
        return IntegrityTestFixtures.getAccessToken(empRepository, encoder, mockMvc, objectMapper, loginId, password);
    }
}
