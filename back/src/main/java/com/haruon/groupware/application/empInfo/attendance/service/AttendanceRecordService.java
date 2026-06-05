package com.haruon.groupware.application.empInfo.attendance.service;

import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.attendance.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.attendance.CheckInRecordNotFoundException;
import com.haruon.groupware.application.exception.empInfo.attendance.ClosedAttendanceEditForbiddenException;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;

@RequiredArgsConstructor
@Service
@Transactional
public class AttendanceRecordService implements AttendanceRecord {

    private final EmpRepository empRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public void recordCheckIn(Long empId, LocalDateTime checkInAt) {
        Emp emp = findActiveEmpById(empRepository, empId);
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

        if(attendance.getAttendanceStatus() != null) throw new ClosedAttendanceEditForbiddenException();

        attendance.recordEndAtByEmp(checkOutAt);
    }


}
