package com.haruon.groupware.domain.empInfo.dto;

import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;
import static org.springframework.util.Assert.state;

/*
 * 권한 : `Emp.SystemRoleCode` = `ADMIN`
 *   모든 부서 내 사원의 이름, 아이디, 비밀번호, 사무실 직통번호, 재직상태, 시스템 권한
 *   , 입사/퇴직일, 파일 사용여부 수정이 가능하다.
 */
@Builder
public record EmpAdminUpdateParam (

        // 직원정보
        @Nullable
        @Size(min = 1, max = 20)
        String empName,

        @Nullable
        @NotBlank
        @Size(min = 5, max = 20)
        String empId,

        @Nullable
        @Pattern(
                regexp = PASSWORD_PATTERN,
                message = PASSWORD_PATTERN_MESSAGE
        )
        String newRawPassword,

        @Nullable
        @Pattern(
                regexp=EXTENSION_NO_PATTERN,
                message = EXTENSION_NO_PATTERN_MESSAGE
        )
        String extensionNo,

        @Nullable
        EmpStatus empStatus,

        @Nullable
        SystemRoleCode systemRoleCode,

        @Nullable
        LocalDate hireAt,

        // empFile : 활성화 여부
        @Nullable
        EmpFileStatusChangeParam changeFileActive,

        // 직원 소속 정보
        @Nullable
        EmpBelongingsParam belongingsParam,

        String companyDomain

) {

    public EmpAdminUpdateParam {
        state(companyDomain != null, "회사 도메인은 필수값");
        state(empName != null || empId != null
                ||  newRawPassword != null ||  extensionNo != null
                || empStatus != null || systemRoleCode != null
                || hireAt != null
                ||  changeFileActive != null ||  belongingsParam != null ,"변경된 정보가 없습니다.");
    }

}
