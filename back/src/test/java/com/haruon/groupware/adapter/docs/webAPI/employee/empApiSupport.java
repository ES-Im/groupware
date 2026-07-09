package com.haruon.groupware.adapter.docs.webapi.employee;

import com.haruon.groupware.application.employee.account.service.query.dto.BelongingInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpBasicInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpFileListInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpInfoResponse;
import com.haruon.groupware.domain.employee.enums.FileType;
import com.haruon.groupware.domain.employee.enums.PositionCode;

import java.time.LocalDate;
import java.util.List;

public class empApiSupport {

    public static EmpInfoResponse getEmpInfoResponse() {
        return new EmpInfoResponse(
                new EmpBasicInfo(1L, "사원번호", "사원명", "아이디", "이메일", "직통번호"),
                List.of(
                        new EmpFileListInfo(1L, "storedFile1", "jpg", 1024L * 1024, true, FileType.SIGNATURE),
                        new EmpFileListInfo(2L, "storedFile2", "jpg", 1024 * 1024L, true, FileType.PROFILE_PICTURE)
                ),
                List.of(
                        new BelongingInfo(1L, "DEPT1", "부서1", PositionCode.STAFF, true, LocalDate.of(2026, 1, 1), null),
                        new BelongingInfo(2L, "DEPT2", "부서2", PositionCode.STAFF, false, LocalDate.of(2026, 1, 1), null)
                )
        );
    }
}
