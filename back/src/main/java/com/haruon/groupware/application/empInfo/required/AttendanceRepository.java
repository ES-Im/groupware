package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Attendance;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends Repository<Attendance, Long> {

    Optional<Attendance> findById(Long id);

    List<Attendance> findByEmpIdAndAttendanceDate(Long empId, LocalDate attendanceDate);

    Attendance save(Attendance attendance);

    int saveAll(Iterable<Attendance> attendances);

    void deleteAll();
}

