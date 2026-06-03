package com.haruon.groupware.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.webapi.auth.EmpLoginRequest;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
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

import java.time.LocalDate;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class IntegrityTestFixtures {

    private static long empNo = 202602002;

    private static String setEmpNo() {
        return empNo++ + "";
    }

    /**
     *  활성화된 부서 생성
     */
    public static Dept getDeptForFixture(DeptRepository deptRepository, String number, String name) {
        return deptRepository.findByDeptCode(number).orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept(number, name)
                )
        );
    }

    /**
     * status = PENDING / 신규사원
     */
    public static void registeredEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register(setEmpNo(), "Test", loginId, password, newEmail, encoder);

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
        Emp test = Emp.register(setEmpNo(), "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        empRepository.save(test);
    }

    public static void suspendedEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register(setEmpNo(), "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        test.suspendEmp();

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
        Emp test = Emp.register(setEmpNo(), "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        empRepository.save(test);
        test.changeEmpFile(
                FileType.PROFILE_PICTURE,
                "image/jpeg",
                "profilePicture",
                "profilePicture content",
                "jpg",
                1024L,
                "/test/emp"
        );
        test.changeEmpFile(
                FileType.SIGNATURE,
                "image/jpeg",
                "signature1",
                "signature1 content",
                "jpg",
                1024L,
                "/test/emp"
        );
        test.changeEmpFile(
                FileType.SIGNATURE,
                "image/jpeg",
                "signature2",
                "signature2 content",
                "jpg",
                1024L,
                "/test/emp"
        );

        Dept it = getDeptForFixture(deptRepository, "002", "IT");

        Dept fin = getDeptForFixture(deptRepository, "003", "FIN");

        test.changeBelongingsByHR(
                it, PositionCode.STAFF, false, LocalDate.of(2026,2,1), null
        );

        test.changeBelongingsByHR(
                fin, PositionCode.STAFF, true, LocalDate.of(2025,1,1), LocalDate.of(2026,1,1)
        );

        empRepository.save(test);
    }

    /**
     * 주부서 : HR 권한 : ADMIN
     */
    public static void getAdmin(
            EmpRepository empRepository,
            DeptRepository deptRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Emp test = Emp.register(setEmpNo(), "AdminName", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        Dept hr = getDeptForFixture(deptRepository, "001", "HR");

        test.changeBelongingsByHR(
                hr, PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2026,1,1), null
        );


        test.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.ADMIN), LocalDate.of(2026,1,1), null);

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
        Emp test = Emp.register(setEmpNo(), "AdminName", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        Dept hr = getDeptForFixture(deptRepository, "001", "HR");

        test.changeBelongingsByHR(
                hr, PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2026,1,1), null
        );


        test.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.HR), LocalDate.of(2026,1,1), null);

        empRepository.save(test);
    }

    /**
     *  주부서 : fin 부부서 : it 권한 : (Manager ROLE) <br>
     */
    public static void getEmpHavingWithManagerRole(
            EmpRepository empRepository,
            DeptRepository deptRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password, Dept dept
    ) {
        Emp test = Emp.register(setEmpNo(), "ManagerName", loginId, password, Email.of(loginId, "haruon.com"), encoder);
        test.approveRegister(LocalDate.of(2026,1,1));

        test.changeBelongingsByHR(
                dept, PositionCode.STAFF, false, LocalDate.of(2026,2,1), null
        );

        test.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.DEPT_MANAGER), LocalDate.of(2026,1,1), null);

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
