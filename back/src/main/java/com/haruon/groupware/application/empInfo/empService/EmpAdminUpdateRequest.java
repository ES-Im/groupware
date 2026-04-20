package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.RegexpUtil.*;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

/*
 * 권한 : `Emp.SystemRoleCode` = `ADMIN`
 *   모든 부서 내 사원의 이름, 아이디, 비밀번호, 사무실 직통번호, 재직상태, 시스템 권한
 *   , 입사/퇴직일, 파일 사용여부 수정이 가능하다.
 */
@Builder
public record EmpAdminUpdateRequest(

        Long adminId,

        Long targetEmpId,

        // 직원정보
        @Nullable
        @Size(min = 1, max = 20)
        String empName,

        @Nullable
        @NotBlank
        @Size(min = 5, max = 20)
        String loginId,

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

        @Nullable
        LocalDate resignedAt,

        // empFile : 활성화 여부
        @Nullable
        EmpFileStatusChangeParam fileStatusParam,

        // 직원 소속 정보
        @Nullable
        EmpBelongingsParam belongingsParam,

        @Nullable
        String companyDomain

) {

    public EmpAdminUpdateRequest {
        requireNonNull(adminId, "수정하는 사람의 deptManagerId(PK) 필수");
        requireNonNull(targetEmpId, "사원의 targetEmpId(PK) 필수");

        if(loginId != null) {
            state(companyDomain != null, "회사 도메인은 필수값");
        }
        state(empName != null || loginId != null
                || newRawPassword != null || extensionNo != null
                || empStatus != null || systemRoleCode != null
                || hireAt != null   || resignedAt != null
                || fileStatusParam != null || belongingsParam != null
                ,"변경된 정보가 없습니다.");

    }

}
