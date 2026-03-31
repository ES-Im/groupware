package com.haruon.groupware.application.schedule.required;

import com.haruon.groupware.domain.schedule.Schedule;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 일정조회
 */
public interface ScheduleRepository extends Repository<ScheduleRepository, Long> {

    List<Schedule> findByEmp_IdAndScheduleDate(Long empId, LocalDate scheduleDate);

}
