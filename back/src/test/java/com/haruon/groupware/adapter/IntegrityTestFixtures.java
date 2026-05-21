package com.haruon.groupware.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.shared.Email;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class IntegrityTestFixtures {


    public static void registerAndApproveEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202601999", "Test", loginId, password, newEmail, encoder);
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
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202601999", "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        test.changeEmpFile(
                FileType.PROFILE_PICTURE, "image/jpeg", "profilePicture", "jpg", 1024L
        );

        test.changeEmpFile(
                FileType.SIGNATURE, "image/jpeg", "oldSig", "jpg", 1024L
        );

        test.changeEmpFile(
                FileType.SIGNATURE, "image/jpeg", "newSig", "jpg", 1024L
        );


        Dept hr = deptRepository.findByDeptCode("001").orElseGet(() ->
            deptRepository.save(
                    Dept.registerDept("001", "HR")
            )
        );

        Dept it = deptRepository.findByDeptCode("002").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("002", "IT")
                )
        );

        Dept fin = deptRepository.findByDeptCode("003").orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept("003", "IT")
                )
        );

        test.changeBelongingsByHR(
                hr, PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2026,1,1), null
        );

        test.changeBelongingsByHR(
                it, PositionCode.STAFF, false, LocalDate.of(2026,2,1), null
        );

        test.changeBelongingsByHR(
                fin, PositionCode.STAFF, true, LocalDate.of(2025,1,1), LocalDate.of(2026,1,1)
        );

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
