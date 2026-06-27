package com.haruon.groupware.adapter.docs.webapi.dept;

import com.haruon.groupware.application.dept.service.query.dto.DeptInfoResponse;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptBasicInfo;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptMemberInfo;
import com.haruon.groupware.domain.employee.enums.PositionCode;

import java.util.List;

public class DeptQueryApiSupport {

    private static Long deptIds = 1L;
    private static Long empIds = 50L;


    List<DeptInfoResponse> getDeptInfoListResponses() {
        return List.of(
                getRootDeptInfoResponse(),
                getDeptInfoResponse(deptIds, "IT", empIds++, "홍길동", PositionCode.ASSISTANT_MANAGER),
                getDeptInfoResponse(deptIds++, "IT", empIds++, "영희", PositionCode.STAFF),
                getDeptInfoResponse(deptIds, "FRANCHISE", empIds++, "김철수", PositionCode.ASSISTANT_MANAGER),
                getDeptInfoResponse(deptIds++, "FRANCHISE", empIds++, "민수", PositionCode.STAFF)
        );
    }

    DeptInfoResponse getRootDeptInfoResponse() {
        return new DeptInfoResponse(
                new DeptBasicInfo(101L, "101", "ROOT", true, null),
                getDeptMemberInfo(empIds++, "테스트", PositionCode.DIRECTOR)
        );
    }

    DeptInfoResponse getDeptInfoResponse(
            long deptId, String deptName,
            long empId, String empName, PositionCode position
    ) {
        return new DeptInfoResponse(getBasicInfo(deptId, deptName), getDeptMemberInfo(empId, empName, position));
    }

    DeptBasicInfo getBasicInfo(long deptId, String name) {
        return new DeptBasicInfo(deptId, (101 + deptId) + "", name, true,  101L);
    }

    DeptMemberInfo getDeptMemberInfo(long empId, String name, PositionCode code) {
        return new DeptMemberInfo(empId, (202601000 + empId) + "", name, "032-" + (1234 + empId), "testEmail1@haruon.com", code);
    }



}
