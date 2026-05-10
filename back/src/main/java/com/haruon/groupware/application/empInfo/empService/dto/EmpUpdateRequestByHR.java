package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

/*
 * 권한 : `Emp.SystemRoleCode` = `ADMIN` or `HR`
 *   모든 부서 내 사원의 이름, 아이디, 비밀번호, 사무실 직통번호, 재직상태, 시스템 권한
 *   , 입사/퇴직일, 파일 사용여부 수정이 가능하다.
 */
@Builder
public record EmpUpdateRequestByHR(

        Long editorId,

        Long targetEmpId,

        // 직원정보
        @Nullable
        String empName,

        @Nullable
        String loginId,

        @Nullable
        String newRawPassword,

        @Nullable
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

    public EmpUpdateRequestByHR {
        if(editorId == null || targetEmpId == null) throw new RequiredValueMissingException();

        if(loginId != null && companyDomain == null) {
            throw new RequiredValueMissingException();
        }

        if(empName == null && loginId == null
                && newRawPassword == null && extensionNo == null
                && empStatus == null && systemRoleCode == null
                && hireAt == null && resignedAt == null
                && fileStatusParam == null && belongingsParam == null
        ) {
            throw new RequiredValueMissingException();
        }


        if(empName != null && empName.isBlank()) throw new BlankValueNotAllowedException();

        if(loginId != null && loginId.isBlank()) throw new BlankValueNotAllowedException();

        if(newRawPassword != null) RegexpValidator.passwordCheck(newRawPassword);

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }

}
