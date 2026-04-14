package com.haruon.groupware.application.schedule.required;

import com.haruon.groupware.domain.schedule.Schedule;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends Repository<Schedule, Long> {

    List<Schedule> findByEmp_IdAndScheduleDate(Long empId, LocalDate scheduleDate);

    Optional<Schedule> findById(Long id);

    Optional<List<Schedule>> findSchedulesBySourceKey(String sourceKey);

    Schedule save(Schedule schedule);

}
