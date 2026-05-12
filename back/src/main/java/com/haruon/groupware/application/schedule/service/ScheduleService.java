package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.schedule.NotManualScheduleException;
import com.haruon.groupware.application.schedule.provided.ScheduleManagement;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.haruon.groupware.application.schedule.service.ScheduleSupport.getSchedulesById;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;
import static java.util.Objects.requireNonNull;

@Service
@Transactional
@RequiredArgsConstructor
public class ScheduleService implements ScheduleManagement {

    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;
    private final EmpRepository empRepository;

    @Override
    public String registerSchedules(ManualScheduleParam param) {
        requireNonNull(param);

        List<Schedule> schedules = registerManualSchedules(param);

        return scheduleRepository.saveAll(schedules).getFirst().getSourceKey();
    }

    @Override
    public void addParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

        targetSchedules.forEach(targetSchedule -> {
            validateManualSchedule(targetSchedule);

            empList.forEach(targetSchedule::addParticipant);
        });

    }

    @Override
    public void removeParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {

        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

        targetSchedules.forEach(targetSchedule -> {
            validateManualSchedule(targetSchedule);

            empList.forEach(targetSchedule::removeParticipant);
        });
    }

    @Override
    public void cancelSchedule(Long scheduleId, boolean isForBulkEdit) {
        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        targetSchedules.forEach(s -> {
            validateManualSchedule(s);

            s.cancel();
        });
    }

    @Override
    public void updateManualSchedule(Long scheduleId, boolean isForBulkEdit, ManualScheduleParam param) {
        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        for (Schedule targetSchedule : targetSchedules) {
            validateManualSchedule(targetSchedule);

            targetSchedule.changeManualSchedule(
                    param.title(), param.content(), param.startAt().toLocalTime(), param.endAt().toLocalTime()
            );
        }
    }

    private List<Schedule> registerManualSchedules(
            ManualScheduleParam manual
    ) {
        Emp scheduleOwner = findActiveEmpById(empRepository, manual.ownerId());
        String newSourceKey = UUID.randomUUID().toString();

        LocalDate startDate = manual.startAt().toLocalDate();
        LocalDate endDate  =  manual.endAt().toLocalDate();
        LocalTime startAt =  manual.startAt().toLocalTime();
        LocalTime endAt =   manual.endAt().toLocalTime();

        return ScheduleSupport.registerSchedule(
                port, startDate, endDate,
                startAt, endAt,
                ScheduleType.MANUAL,
                manual.title(), manual.content(),
                scheduleOwner,
                Set.of(),
                newSourceKey);
    }

    private void validateManualSchedule(Schedule manual) {
        if(!manual.getScheduleType().equals(ScheduleType.MANUAL)) {
            throw new NotManualScheduleException();
        }
    }

}
