package com.haruon.groupware.application.employee.attendance.service.command;

import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.employee.attendance.provided.forCommand.AttendanceRecord;
import com.haruon.groupware.application.employee.attendance.required.AttendanceRepository;
import com.haruon.groupware.application.exception.employee.attendance.CheckInRecordNotFoundException;
import com.haruon.groupware.application.exception.employee.attendance.ClosedAttendanceEditForbiddenException;
import com.haruon.groupware.domain.employee.Attendance;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static com.haruon.groupware.domain.employee.Attendance.registerAttendanceByEmp;

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
