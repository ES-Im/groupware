package com.haruon.groupware.application.schedule.required;

import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends Repository<ScheduleRepository, Long> {

    List<Schedule> findByEmp_IdAndScheduleDate(Long empId, LocalDate scheduleDate);

    Optional<Schedule> findById(Long id);

    Optional<List<Schedule>> findByScheduleTypeAndSourceId(ScheduleType scheduleType, Long sourceId);

    List<Schedule> saveAll(List<Schedule> schedules);

    @Query("""
        select max(s.sourceId)
          from Schedule s
         where s.scheduleType = 'MANUAL'
    """)
    Long findLastManualSourceId();
}
