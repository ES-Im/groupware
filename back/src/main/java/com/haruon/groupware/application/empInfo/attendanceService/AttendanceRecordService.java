package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.empInfo.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.CheckInRecordNotFoundException;
import com.haruon.groupware.application.exception.empInfo.ClosedAttendanceEditForbiddenException;
import com.haruon.groupware.application.utils.AuthorizationChecker;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.findAttendanceById;
import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;

@RequiredArgsConstructor
@Service
@Transactional
public class AttendanceRecordService implements AttendanceRecord {

    private final EmpRepository empRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public void recordCheckIn(Long empId, LocalDateTime checkInAt) {
        Emp emp = AuthorizationChecker.findActiveEmpById(empRepository, empId);
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
                .orElseThrow(CheckInRecordNotFoundException::new);

        attendance.recordEndAtByEmp(checkOutAt);
    }


    @Override
    public void rerecordEndAtByEmp(Long attendanceId, LocalDateTime checkOutAt) {
        Attendance attendance = findAttendanceById(attendanceRepository, attendanceId);
        if(attendance.getAttendanceStatus() != null) throw new ClosedAttendanceEditForbiddenException();

        attendance.recordEndAtByEmp(checkOutAt);
    }

}
