package com.haruon.groupware.application.empInfo.attendance.service;

import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceEditing;
import com.haruon.groupware.application.empInfo.attendance.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.ApproveAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.EditAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.exception.empInfo.attendance.AttendanceEmpMismatchException;
import com.haruon.groupware.application.exception.empInfo.attendance.WorkTimeRangeRequiredException;
import com.haruon.groupware.application.utils.projection.DeptManagerAndTargetEmpInfo;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

import static com.haruon.groupware.application.empInfo.attendance.service.AttendanceUtils.findAttendanceById;
import static com.haruon.groupware.application.empInfo.attendance.service.AttendanceUtils.getStatusByRecognizedHours;
import static com.haruon.groupware.application.utils.AuthValidator.checkSameDeptManagerByManagerIdAndEmpId;

@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceEditingService implements AttendanceEditing {

    private final AttendanceRepository attendanceRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;
    private final CompanyPolicyPort companyPolicy;


    @Override
    public void updateApproveAttendance(Long managerId, Long attendanceId, ApproveAttendanceByDeptManagerRequest param) {
        DeptManagerAndTargetEmpInfo deptManagerInfo = checkSameDeptManagerByManagerIdAndEmpId(
                authorizationQueryRepository,
                managerId,
                param.targetEmpId()
        );

        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);

        Emp manager = deptManagerInfo.managerEmp();
        Emp targetEmp = deptManagerInfo.editedTargetEmp();

        if(!targetEmp.equals(attendance.getEmp())) throw new AttendanceEmpMismatchException();

        attendance.approveAttendance(manager, param.approvedAt());
    }

    @Override
    public void updateAttendanceByDeptManager(Long managerId, Long attendanceId, EditAttendanceByDeptManagerRequest param) {
        DeptManagerAndTargetEmpInfo deptManagerInfo = checkSameDeptManagerByManagerIdAndEmpId(
                authorizationQueryRepository,
                managerId,
                param.targetEmpId()
        );
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        Emp manager = deptManagerInfo.managerEmp();
        Emp targetEmp = deptManagerInfo.editedTargetEmp();

        if(!targetEmp.equals(attendance.getEmp())) throw new AttendanceEmpMismatchException();

        int requiredWorkHours = companyPolicy.getWorkHours() - companyPolicy.getBreakHours();

        LocalTime editedStartAt =
                param.startAt() != null ? param.startAt() : attendance.getStartAt();
        LocalTime editedEndAt =
                param.endAt() != null ? param.endAt() : attendance.getEndAt();

        if(attendance.getStartAt() != null && attendance.getEndAt() != null &&
                attendance.getStartAt().equals(editedStartAt) && attendance.getEndAt().equals(editedEndAt)) {
            return;
        }

        if(editedStartAt == null || editedEndAt == null) throw new WorkTimeRangeRequiredException();

        boolean includeHalfLeaveInDay = attendanceRepository
                .findByEmpIdAndAttendanceDate(targetEmp.getId(), attendance.getAttendanceDate())
                .stream()
                .anyMatch(sameDayAttendance ->
                        sameDayAttendance.getAttendanceStatus() == AttendanceStatus.HALF_DAY_LEAVE
                );

        AttendanceStatus editedStatus = getStatusByRecognizedHours(
                editedStartAt,
                editedEndAt,
                requiredWorkHours,
                includeHalfLeaveInDay
        );

        attendance.changeAttendanceByDeptManager(
                editedStartAt,
                editedEndAt,
                editedStatus,
                param.editedAt(),
                param.editReason(),
                manager
        );

    }
}
