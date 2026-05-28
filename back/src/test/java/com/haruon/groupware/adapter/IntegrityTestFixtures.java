package com.haruon.groupware.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpFileReplaceParam;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class IntegrityTestFixtures {

    /**
     * status = PENDING / 신규사원
     */
    public static void registeredEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202602001", "Test", loginId, password, newEmail, encoder);

        empRepository.save(test);
    }

    /**
     * status = ACTIVE / 막 가입승인된 사원
     */
    public static void registerAndApproveEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202602002", "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        empRepository.save(test);
    }

    /**
     *  주부서 : HR / 부부서 : IT / 이전부서 : FIN <br>
     *  현재전자서명 : newSig / 예전전자서명 : oldSig / 현재프사 : profilePicture
     */
    public static void getEmpHavingAllInfo(
            EmpRepository empRepository,
            DeptRepository deptRepository,
            EmpPasswordEncoder encoder,
            EmpAccountManager empAccountManager,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202601999", "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        empRepository.save(test);
        EmpFileReplaceParam profileFile1 = EmpFileReplaceParam.builder()
                .file(FileDto.builder()
                        .mimeType("image/jpeg")
                        .originalFileFullName("profilePicture.jpg")
                        .fileSize(1024L)
                        .bytes("profilePicture content".getBytes(StandardCharsets.UTF_8))
                        .build()
                ).fileType(FileType.PROFILE_PICTURE)
                .build();

        EmpFileReplaceParam signature1 = EmpFileReplaceParam.builder()
                .file(FileDto.builder()
                        .mimeType("image/jpeg")
                        .originalFileFullName("signature1.jpg")
                        .fileSize(1024L)
                        .bytes("signature content".getBytes(StandardCharsets.UTF_8))
                        .build()
                ).fileType(FileType.SIGNATURE)
                .build();

        EmpFileReplaceParam signature2 = EmpFileReplaceParam.builder()
                .file(FileDto.builder()
                        .mimeType("image/jpeg")
                        .originalFileFullName("signature2.jpg")
                        .fileSize(1024L)
                        .bytes("signature content".getBytes(StandardCharsets.UTF_8))
                        .build()
                ).fileType(FileType.SIGNATURE)
                .build();

        empAccountManager.updateEmpFileBySelf(profileFile1, test.getId());
        empAccountManager.updateEmpFileBySelf(signature1, test.getId());
        empAccountManager.updateEmpFileBySelf(signature2, test.getId());

        Dept it = deptRepository.findByDeptCode("002").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("002", "IT")
                )
        );

        Dept fin = deptRepository.findByDeptCode("003").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("003", "FIN")
                )
        );

        test.changeBelongingsByHR(
                it, PositionCode.STAFF, false, LocalDate.of(2026,2,1), null
        );

        test.changeBelongingsByHR(
                fin, PositionCode.STAFF, true, LocalDate.of(2025,1,1), LocalDate.of(2026,1,1)
        );

        empRepository.save(test);
    }

    /**
     *  주부서 : HR 권한 : (HR ROLE) <br>
     */
    public static void getEmpHavingWithHrRole(
            EmpRepository empRepository,
            DeptRepository deptRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Emp test = Emp.register("202601000", "AdminName", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        Dept hr = deptRepository.findByDeptCode("001").orElseGet(() ->
            deptRepository.save(
                    Dept.registerDept("001", "HR")
            )
        );

        test.changeBelongingsByHR(
                hr, PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2026,1,1), null
        );


        test.changeInfoByHR(null, null, null, null, Set.of(SystemRoleCode.HR), LocalDate.of(2026,1,1), null);

        empRepository.save(test);
    }

    /**
     *  주부서 : fin 부부서 : it 권한 : (Manager ROLE) <br>
     */
    public static void getEmpHavingWithManagerRole(
            EmpRepository empRepository,
            DeptRepository deptRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Emp test = Emp.register("202601500", "ManagerName", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        Dept it = deptRepository.findByDeptCode("002").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("002", "IT")
                )
        );

        Dept fin = deptRepository.findByDeptCode("003").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("003", "FIN")
                )
        );

        test.changeBelongingsByHR(
                it, PositionCode.STAFF, false, LocalDate.of(2026,2,1), null
        );

        test.changeBelongingsByHR(
                fin, PositionCode.STAFF, true, LocalDate.of(2025,1,1), LocalDate.of(2026,1,1)
        );


        test.changeInfoByHR(null, null, null, null, Set.of(SystemRoleCode.DEPT_MANAGER), LocalDate.of(2026,1,1), null);

        empRepository.save(test);
    }

    public static String getAccessToken(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            String loginId, String password
    ) throws Exception {
        if(empRepository.findByLoginId(loginId).isEmpty()) {
            registerAndApproveEmp(empRepository, encoder, loginId, password);
        }

        EmpLoginRequest request = new EmpLoginRequest(loginId, password);

        MvcResult result = mockMvc.perform(
                        post("/api/auth/login")
                                .content(objectMapper.writeValueAsBytes(request))
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn();

        String contentAsString = result.getResponse().getContentAsString();
        return objectMapper.readTree(contentAsString).get("accessToken").asText();
    }

}
