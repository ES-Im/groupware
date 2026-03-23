package com.haruon.groupware.domain.empInfo.emp.dto;

import com.haruon.groupware.domain.empInfo.emp.EmpStatus;
import com.haruon.groupware.domain.empInfo.emp.SystemRoleCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static org.springframework.util.Assert.state;

/*
 * 권한 : `Emp.SystemRoleCode` = `ADMIN`
 *   모든 부서 내 사원의 이름, 아이디, 비밀번호, 사무실 직통번호, 재직상태, 시스템 권한
 *   , 입사/퇴직일, 파일 사용여부 수정이 가능하다.
 */
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
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
                message = "비밀번호는 영문+숫자+특수문자 조합을 해야합니다."
        )
        String rawNewPassword,

        @Nullable
        @Pattern(
                regexp="^\\d{3,4}-\\d{4}$",
                message = "내선번호는 `3~4자리 숫자 - 4자리 숫자 형식`이어야 합니다."
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
        EmpBelongingsParam belongingsParam

) {

    public boolean hasChange() {
        return empName != null || empId != null
                ||  rawNewPassword != null ||  extensionNo != null
                || empStatus != null || systemRoleCode != null
                || hireAt != null
                ||  changeFileActive != null ||  belongingsParam != null;
    }

    public EmpAdminUpdateParam {
        state(hasChange(),"변경된 정보가 없습니다.");
    }

}
