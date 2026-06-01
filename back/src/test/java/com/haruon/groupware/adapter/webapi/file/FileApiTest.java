package com.haruon.groupware.adapter.webapi.file;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.adapter.IntegrityTestFixtures;
import com.haruon.groupware.adapter.persistence.emp.EmpQueryRepositoryAdapter;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@Import(FileApiTest.FileApiTestConfig.class)
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
                        get("/api/employees/{empId}/files/{fileId}/preview", emp.getId(), fileId)
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("image/jpeg")))
                .andExpect(content().string(containsString("profilePicture content")));
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
                        get("/api/employees/{empId}/files/{fileId}/download", emp.getId(), fileId)
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("image/jpeg")))
                .andExpect(content().string(containsString("profilePicture content")));
    }

    private void getEmpHavingFiles(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingAllInfo(empRepository, deptRepository, encoder, loginId, password);
    }

    private String login(String loginId, String password) throws Exception {
        return IntegrityTestFixtures.getAccessToken(empRepository, encoder, mockMvc, objectMapper, loginId, password);
    }

    @TestConfiguration
    static class FileApiTestConfig {

        @Bean
        @Primary
        FileStorage fileStorage() {
            return new FileStorage() {
                @Override
                public StoreFile store(FileDto fileDto, String fileType) {
                    String storedName = "stored-" + fileDto.originalFileFullName();

                    return new StoreFile(
                            fileDto.originalFileName(),
                            storedName,
                            fileDto.mimeType(),
                            fileDto.extension(),
                            fileDto.fileSize(),
                            "/test/" + fileType
                    );
                }

                @Override
                public Resource loadAsResource(String storedPath, String storedName) {
                    byte[] bytes = ("test-resource:" + Path.of(storedPath).resolve(storedName))
                            .getBytes(StandardCharsets.UTF_8);

                    return new ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return storedName;
                        }
                    };
                }

                @Override
                public void delete(String storedPath, String storedName) {
                }
            };
        }
    }
}
