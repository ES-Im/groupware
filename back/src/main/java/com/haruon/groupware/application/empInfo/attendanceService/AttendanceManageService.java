package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.SubAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.provided.AttendanceManagement;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static com.haruon.groupware.application.Utils.findEmpById;
import static com.haruon.groupware.application.empInfo.EmpInfoUtils.findAttendanceById;
import static com.haruon.groupware.application.empInfo.EmpInfoUtils.getStatusByRecognizedHours;
import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendance;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceManageService implements AttendanceManagement {

    private final AttendanceRepository attendanceRepository;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort port;

    private static final List<AttendanceStatus> WORKING_STATUS = List.of(
            AttendanceStatus.NORMAL, AttendanceStatus.ABSENT, AttendanceStatus.LATE_EARLY
    );

    @Override
    public int updateApproveAttendance(Long attendanceId, Long approverId, LocalDateTime approvedAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        Emp emp = findEmpById(empRepository, approverId);

        attendance.approveAttendance(emp, approvedAt);

        return 1;
    }

    @Override
    public int updateEndAtByEmp(Long attendanceId, Long empId, LocalDateTime endAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        Emp emp = findEmpById(empRepository, empId);
        state(attendance.getEmp().equals(emp), "본인 근태만 퇴근 처리가능");

        attendance.recordEndAtByEmp(endAt);

        return 1;
    }

    @Override
    public int updateAttendanceByDeptManager(EditAttendanceByDeptManagerParam param) {
        int result = 1;
        Attendance attendance = findAttendanceById(attendanceRepository, param.attendanceId());
        Emp editor = findEmpById(empRepository, param.editorId());

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

        if (param.newSubAttendance() != null) {
            createSubAttendance(
                    param.newSubAttendance(),
                    attendance,
                    editor,
                    param.editedAt(),
                    param.editReason()
            );

            result++;
        }

        return result;
    }

    private void createSubAttendance(
            SubAttendanceByDeptManagerParam subParam,
            Attendance mainAttendance,
            Emp editor,
            LocalDateTime editedAt,
            String editReason
    ) {
        validateSubAttendanceNotOverlap(mainAttendance, subParam);

        Attendance subAttendance = registerAttendance(
                mainAttendance.getEmp(),
                mainAttendance.getAttendanceDate(),
                subParam.status(),
                subParam.startAt(),
                subParam.endAt()
        );

        subAttendance.markEditor(editor, editedAt, editReason);

        attendanceRepository.save(subAttendance);
    }


    private void validateSubAttendanceNotOverlap(
            Attendance mainAttendance,
            SubAttendanceByDeptManagerParam subParam
    ) {
        requireNonNull(mainAttendance, "메인 근태 정보 없음");
        requireNonNull(subParam, "서브 근태 정보 없음");

        LocalTime mainStartAt = mainAttendance.getStartAt();
        LocalTime mainEndAt = mainAttendance.getEndAt();

        LocalTime subStartAt = subParam.startAt();
        LocalTime subEndAt = subParam.endAt();

        state(subStartAt != null && subEndAt != null, "서브 근태 시간 정보 필수");

        state(mainStartAt != null && mainEndAt != null, "메인 근태 시간 정보 없음");

        state(!mainEndAt.isBefore(mainStartAt), "메인 근태 시간 범위 이상");
        state(!subEndAt.isBefore(subStartAt), "서브 근태 시간 범위 이상");

        boolean isOverlapping =
                mainStartAt.isBefore(subEndAt) &&
                        subStartAt.isBefore(mainEndAt);

        state(!isOverlapping, "두 근태 기록은 겹칠 수 없음");
    }


}
