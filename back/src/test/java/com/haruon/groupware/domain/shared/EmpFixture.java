package com.haruon.groupware.domain.shared;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpFile;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;

import java.time.LocalDate;
import java.util.Locale;

import static com.haruon.groupware.domain.shared.DeptFixture.getDept;

public class EmpFixture {

    public static Emp getApprovedEmp(String empNo, String loginId) {
        Emp emp = getRegisteredEmp(empNo, loginId);
        emp.approveRegister(LocalDate.of(2026, 1, 1));
        addBelongings(emp);
        return emp;
    }

    public static Emp getApprovedEmpWithoutDept(String empNo, String loginId) {
        Emp emp = getRegisteredEmp(empNo, loginId);
        emp.approveRegister(LocalDate.of(2026, 1, 1));
        return emp;
    }

    /**
     * 테스트용 사원 픽스처 <br>
     * 1. 부서 : "00001", "testDept" <br>
     * 2. 사원 정보 : [ <br>
     *    - 사번 : "202601001", <br>
     *    - name : "Test", <br>
     *    - targetEmpId : "Test", <br>
     *    - email : "Test@test.com", <br>
     *    - rawPw : "!1currentPassword" <br>
     * ] <br>
     */
    public static Emp getApprovedEmp() {
        Emp emp = getRegisteredEmp();

        emp.approveRegister(LocalDate.of(2026, 1, 1));

        return emp;
    }

    /**
     * 테스트용 관리자 픽스처 <br>
     * 1. 부서 : "00001", "testDept" <br>
     * 2. 사원 정보 : [ <br>
     *    - 사번 : "202601999", <br>
     *    - name : "Test", <br>
     *    - targetEmpId : "Admin", <br>
     *    - email : "Admin@test.com", <br>
     *    - rawPw : "!1currentPassword" <br>
     * ] <br>
     */
    public static Emp getAdmin() {
        Emp emp = getRegisteredEmp("202601999", "Admin");
        emp.approveRegister(LocalDate.of(2026, 1, 1));

        emp.changeInfoByAdmin(
                null,
                null,
                null,
                null,
                null,
                null,
                SystemRoleCode.ADMIN,
                null,
                encoder
        );


        return emp;
    }

    public static void addBelongings(Emp emp) {
        emp.changeBelongingsByAdmin(
                getDept(),
                PositionCode.STAFF,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );
    }


    public static EmpFile addFileWithType(Emp emp, FileType fileType) {
        emp.changeEmpFile(
                fileType,
                "image/jpg",
                "testOriginFileName",
                "jpeg",
                (long)(1024 * 1024)
        );

        return emp.getEmpFiles().getLast();
    }

    public static Emp getRegisteredEmp() {
        Email newEmail = Email.of("Test", "@haruon.com");
        return Emp.register("202601001", "Test", "Test", "!1currentPassword", newEmail, encoder);
    }

    public static Emp getRegisteredEmp(String empNo, String loginId) {
        Email newEmail = Email.of(loginId, "haruon.com");
        return Emp.register(empNo, "Test", loginId, "!1currentPassword", newEmail, encoder);
    }

    public static PasswordEncoder encoder = new PasswordEncoder() {
        @Override
        public String encode(String rawPassword) {
            return rawPassword.toUpperCase(Locale.ROOT);
        }

        @Override
        public boolean matches(String rawPassword, String encodedPassword) {
            return encodedPassword.equals(encode(rawPassword));
        }
    };
}
