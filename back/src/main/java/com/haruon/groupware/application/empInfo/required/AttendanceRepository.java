package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Attendance;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * 사원 근태조회
 */
public interface AttendanceRepository extends Repository<Attendance, Long> {

    Optional<Attendance> findById(Long id);

    Optional<Attendance> findByEmpIdAndAttendanceDate(Long empId, LocalDate attendanceDate);

    Optional<Attendance> save(Attendance attendance);

    int saveAll(Iterable<Attendance> attendances);


}

