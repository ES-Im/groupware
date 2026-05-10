package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.attendanceService.dto.ApproveAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.provided.AttendanceEditing;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.AttendanceEmpMismatchException;
import com.haruon.groupware.application.exception.empInfo.WorkTimeRangeRequiredException;
import com.haruon.groupware.application.utils.AuthorizationChecker.DeptManagerInfo;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.findAttendanceById;
import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.getStatusByRecognizedHours;
import static com.haruon.groupware.application.utils.AuthorizationChecker.checkDeptManagerById;

@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceEditingService implements AttendanceEditing {

    private final AttendanceRepository attendanceRepository;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort companyPolicy;


    @Override
    public void updateApproveAttendance(ApproveAttendanceByDeptManagerParam param) {
        DeptManagerInfo deptManagerInfo = checkDeptManagerById(empRepository, param.approverId(), param.targetEmpId());

        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());

        Emp manager = deptManagerInfo.manager();
        Emp targetEmp = deptManagerInfo.targetEmp();

        if(!targetEmp.equals(attendance.getEmp())) throw new AttendanceEmpMismatchException();

        attendance.approveAttendance(manager, param.approvedAt());
    }

    @Override
    public void updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param) {
        DeptManagerInfo deptManagerInfo = checkDeptManagerById(empRepository, param.editorId(), param.targetEmpId());
        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());
        Emp manager = deptManagerInfo.manager();
        Emp targetEmp = deptManagerInfo.targetEmp();

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

        AttendanceStatus editedStatus = getStatusByRecognizedHours(
                editedStartAt,
                editedEndAt,
                requiredWorkHours,
                param.isIncludeHalfLeaveInDay()
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
