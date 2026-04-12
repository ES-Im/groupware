package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.Utils;
import com.haruon.groupware.application.empInfo.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;

@RequiredArgsConstructor
@Service
@Transactional
public class AttendanceRecordService implements AttendanceRecord {

    private final EmpRepository empRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public int recordCheckIn(Long empId, LocalDateTime checkInAt) {
        Emp emp = Utils.findActiveEmpById(empRepository, empId);
        emp.ensureActive();

        Attendance attendance = registerAttendanceByEmp(emp, checkInAt);

        attendanceRepository.save(attendance);

        return 1;
    }

    @Override
    public int recordCheckOut(Long empId, LocalDateTime checkOutAt) {
        LocalDate attendanceDate = checkOutAt.toLocalDate();

        Attendance attendance = attendanceRepository
                .findByEmpIdAndAttendanceDate(empId, attendanceDate)
                .orElseThrow(() ->
                        new RuntimeException("출근기록이 없음")    // to-do : 커스텀 예외 처리 필요
                );

        return attendance.recordEndAtByEmp(checkOutAt);
    }
}
