package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.provided.AttendanceManagement;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.*;
import static org.springframework.util.Assert.state;

@Service
@Transactional
@RequiredArgsConstructor
@Validated
public class AttendanceService implements AttendanceManagement {

    private final AttendanceRepository attendanceRepository;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort port;

    private static final List<AttendanceStatus> WORKING_STATUS = List.of(
            AttendanceStatus.NORMAL, AttendanceStatus.ABSENT, AttendanceStatus.LATE_EARLY
    );

    @Override
    public Attendance updateApproveAttendance(Long attendanceId, Long approverId, LocalDateTime approvedAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        Emp emp = findEmpById(empRepository, approverId);

        attendance.approveAttendance(emp, approvedAt);

        return attendance;
    }

    @Override
    public Attendance updateEndAtByEmp(Long attendanceId, Long empId, LocalDateTime endAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        Emp emp = findEmpById(empRepository, empId);
        state(attendance.getEmp().equals(emp), "본인 근태만 퇴근 처리가능");

        attendance.recordEndAtByEmp(endAt);

        return attendance;
    }

    @Override
    public Attendance updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param) {
        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());
        Emp editor =  findEmpById(empRepository, param.editorId());

        int requiredWorkHours = port.getWorkHours() - port.getBreakHours();

        AttendanceStatus status = param.status();

        boolean shouldRecalculateStatus =
                param.status() == null || WORKING_STATUS.contains(param.status());

        if (shouldRecalculateStatus) {
            status = getStatusByRecognizedHours(
                    param.startAt(),
                    param.endAt(),
                    requiredWorkHours,
                    param.isIncludeHalfLeaveInDay()
            );
        }

        attendance.changeAttendanceByDeptManager(
                param.startAt(),
                param.endAt(),
                status,
                param.editedAt(),
                param.editReason(),
                editor,
                requiredWorkHours
        );

        return attendance;
    }



}
