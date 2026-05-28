package com.haruon.groupware.application.empInfo.empService.dto.request;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.Set;

/*
 * 권한 : `Emp.SystemRoleCode` = `ADMIN` or `HR`
 *   모든 부서 내 사원의 이름, 비밀번호, 사무실 직통번호, 재직상태, 시스템 권한
 *   , 입사/퇴직일, 파일 사용여부 수정이 가능하다.
 */
@Builder
public record EmpUpdateRequestByHR(

        Long targetEmpId,

        // 직원정보
        @Nullable
        String empName,

        @Nullable
        String newRawPassword,

        @Nullable
        String extensionNo,

        @Nullable
        EmpStatus empStatus,

        @Nullable
        Set<SystemRoleCode> systemRoleCode,

        @Nullable
        LocalDate hireAt

) {

    public EmpUpdateRequestByHR {

        if(targetEmpId == null) throw new RequiredValueMissingException();

        if(systemRoleCode != null
                && (systemRoleCode.isEmpty() || systemRoleCode.stream().anyMatch(roleCode -> roleCode == null))) {
            throw new RequiredValueMissingException();
        }

        if(empName == null
                && newRawPassword == null && extensionNo == null
                && empStatus == null && systemRoleCode == null
                && hireAt == null
        ) {
            throw new RequiredValueMissingException();
        }


        if(empName != null && empName.isBlank()) throw new BlankValueNotAllowedException();

        if(newRawPassword != null) RegexpValidator.passwordCheck(newRawPassword);

        if(extensionNo != null) RegexpValidator.extensionNoCheck(extensionNo);
    }

}
