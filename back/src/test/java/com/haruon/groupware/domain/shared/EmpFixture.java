package com.haruon.groupware.domain.shared;

import com.haruon.groupware.domain.FileParam;
import com.haruon.groupware.domain.empInfo.emp.*;
import com.haruon.groupware.domain.empInfo.emp.dto.*;
import com.haruon.groupware.domain.empInfo.emp.enums.FileType;
import com.haruon.groupware.domain.empInfo.emp.enums.PositionCode;

import java.time.LocalDate;
import java.util.Locale;

import static com.haruon.groupware.domain.shared.DeptFixture.getDept;

public class EmpFixture {

    public static Emp getApprovedEmp() {
        Emp emp = getRegisteredEmp();

        emp.approveRegister(LocalDate.of(2026, 1, 1));

        return emp;
    }

    public static void addBelongings(Emp emp) {
        EmpBelongingsParam empBelongingsParam = EmpBelongingsParam.builder()
                .dept(getDept())
                .position(PositionCode.STAFF)
                .isPrimary(true)
                .startAt(LocalDate.of(2026, 1, 1))
                .build();
        emp.changeInfoByAdmin(EmpAdminUpdateParam.builder()
                        .belongingsParam(empBelongingsParam)
                        .companyDomain("@haruon.com")
                        .build(), null);
    }

    public static EmpFile addFileWithType(Emp emp, FileType fileType, String password) {
        emp.changeInfoBySelf(EmpSelfUpdateParam.builder()
                        .inputPassword(password)
                        .fileRequest(fileParam(fileType))
                        .build(), encoder);

        return emp.getEmpFiles().getLast();
    }

    public static Emp getRegisteredEmp() {
        EmpRegisterParam empRegisterParam = new EmpRegisterParam("202601001", "Test", "Test", "!1currentPassword");
        return Emp.register(empRegisterParam, encoder);
    }

    public static EmpFileParam fileParam(FileType fileType) {
        return EmpFileParam.builder()
                    .fileParam(FileParam.builder()
                            .originalName("testOriginFileName")
                            .mimeType("image/jpg")
                            .extension("jpeg")
                            .fileSize((long)(1024 * 1024))
                            .build())
                    .fileType(fileType)
                    .build();
    }

    public static PasswordEncoder encoder = new PasswordEncoder() {
        @Override
        public String encode(String rawPassword) {
            return rawPassword.toUpperCase(Locale.getDefault());
        }

        @Override
        public boolean matches(String rawPassword, String encodedPassword) {
            return encodedPassword.equals(encode(rawPassword));
        }
    };
}
