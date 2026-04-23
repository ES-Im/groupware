package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.Utils;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.findAttendanceById;
import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;
import static org.springframework.util.Assert.state;

@RequiredArgsConstructor
@Service
@Transactional
public class AttendanceRecordService implements AttendanceRecord {

    private final EmpRepository empRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public void recordCheckIn(Long empId, LocalDateTime checkInAt) {
        Emp emp = Utils.findActiveEmpById(empRepository, empId);
        emp.ensureActive();

        Attendance attendance = registerAttendanceByEmp(emp, checkInAt);

        attendanceRepository.save(attendance);
    }

    @Override
    public void recordCheckOut(Long empId, LocalDateTime checkOutAt) {
        LocalDate attendanceDate = checkOutAt.toLocalDate();

        Attendance attendance = attendanceRepository
                .findByEmpIdAndAttendanceDate(empId, attendanceDate)
                .stream().findFirst()
                .orElseThrow(() ->
                        new IllegalStateException("출근기록이 없음")    // to-do : 커스텀 예외 처리 필요
                );

        attendance.recordEndAtByEmp(checkOutAt);
    }


    @Override
    public void rerecordEndAtByEmp(Long attendanceId, LocalDateTime checkOutAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        state(attendance.getAttendanceStatus() == null, "마감된 근태는 사원이 근태시간을 수정할 수 없음");

        attendance.recordEndAtByEmp(checkOutAt);
    }

}
