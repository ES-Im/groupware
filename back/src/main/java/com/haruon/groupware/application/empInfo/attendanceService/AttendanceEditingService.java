package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.attendanceService.dto.ApproveAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.provided.AttendanceEditing;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.provided.ScheduleRegister;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.Map;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.findAttendanceById;
import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.getStatusByRecognizedHours;
import static com.haruon.groupware.application.utils.Utils.checkDeptManagerById;
import static org.springframework.util.Assert.state;

@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceEditingService implements AttendanceEditing {

    private final AttendanceRepository attendanceRepository;
    private final ScheduleRegister scheduleRegister;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort companyPolicy;


    @Override
    public void updateApproveAttendance(ApproveAttendanceByDeptManagerParam param) {
        Map<String, Emp> empMap = checkDeptManagerById(empRepository, param.approverId(), param.targetEmpId());

        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());

        Emp manager = empMap.get("manager");
        Emp targetEmp = empMap.get("targetEmp");

        state(targetEmp.getId().equals(attendance.getEmp().getId()),
                "해당 사원의 근태가 아님");

        attendance.approveAttendance(manager, param.approvedAt());
    }

    @Override
    public void updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param) {
        Map<String, Emp> empMap = checkDeptManagerById(empRepository, param.editorId(), param.targetEmpId());
        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());
        Emp editor = empMap.get("manager");
        Emp targetEmp = empMap.get("targetEmp");

        state(targetEmp.getId().equals(attendance.getEmp().getId()),
                "해당 사원의 근태가 아님");

        int requiredWorkHours = companyPolicy.getWorkHours() - companyPolicy.getBreakHours();

        LocalTime editedStartAt =
                param.startAt() != null ? param.startAt() : attendance.getStartAt();
        LocalTime editedEndAt =
                param.endAt() != null ? param.endAt() : attendance.getEndAt();

        if(attendance.getStartAt().equals(editedStartAt)
                && attendance.getEndAt().equals(editedEndAt)) {
            return;
        }

        state(editedStartAt != null && editedEndAt != null,
                "정상근무 계산을 하려면 시작시각과 종료시각이 모두 필요함");

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
                editor
        );

    }
}
