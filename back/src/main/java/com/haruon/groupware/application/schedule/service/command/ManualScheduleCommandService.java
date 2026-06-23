package com.haruon.groupware.application.schedule.service.command;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.schedule.NotManualScheduleException;
import com.haruon.groupware.application.exception.schedule.ScheduleOwnerNotMatchException;
import com.haruon.groupware.application.exception.schedule.ScheduleOwnerRemovalNotAllowedException;
import com.haruon.groupware.application.exception.schedule.ScheduleTimeOutsideCompanyHoursException;
import com.haruon.groupware.application.schedule.provided.ScheduleManagement;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.schedule.service.command.request.ManualScheduleCreateRequest;
import com.haruon.groupware.application.schedule.service.command.request.ManualScheduleUpdateRequest;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
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

import static com.haruon.groupware.application.schedule.service.command.ScheduleSupport.getSchedulesById;
import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;
import static java.util.Objects.requireNonNull;

@Service
@Transactional
@RequiredArgsConstructor
public class ManualScheduleCommandService implements ScheduleManagement {

    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;
    private final EmpRepository empRepository;

    @Override
    public String registerSchedules(Long ownerId, ManualScheduleCreateRequest param) {
        requireNonNull(ownerId);
        requireNonNull(param);

        List<Schedule> schedules = registerManualSchedules(ownerId, param);

        return scheduleRepository.saveAll(schedules).getFirst().getSourceKey();
    }

    @Override
    public void addParticipants(Long scheduleId, Long ownerId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        validateScheduleOwner(scheduleId, ownerId);

        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

        targetSchedules.forEach(targetSchedule -> {
            validateManualSchedule(targetSchedule);

            empList.forEach(targetSchedule::addParticipant);
        });

    }

    @Override
    public void removeParticipants(Long scheduleId, Long ownerId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        validateScheduleOwner(scheduleId, ownerId);

        if(participantEmpIds.contains(ownerId)) throw new ScheduleOwnerRemovalNotAllowedException();

        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

        targetSchedules.forEach(targetSchedule -> {
            validateManualSchedule(targetSchedule);

            empList.forEach(targetSchedule::removeParticipant);
        });
    }

    @Override
    public void cancelSchedule(Long scheduleId, Long ownerId, boolean isForBulkEdit) {
        validateScheduleOwner(scheduleId, ownerId);

        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        targetSchedules.forEach(s -> {
            validateManualSchedule(s);

            s.cancel();
        });
    }

    @Override
    public void updateManualSchedule(Long scheduleId, Long ownerId, boolean isForBulkEdit, ManualScheduleUpdateRequest param) {
        validateScheduleOwner(scheduleId, ownerId);

        List<Schedule> targetSchedules = getSchedulesById(scheduleRepository, scheduleId, isForBulkEdit);

        for (Schedule targetSchedule : targetSchedules) {
            validateManualSchedule(targetSchedule);
            validateUpdateTime(targetSchedule, param);

            targetSchedule.changeManualSchedule(
                    param.title(), param.content(),
                    param.startAt(), param.endAt()
            );
        }
    }

    private void validateUpdateTime(Schedule targetSchedule, ManualScheduleUpdateRequest param) {
        LocalTime startAt = param.startAt() != null ? param.startAt() : targetSchedule.getStartAt();
        LocalTime endAt = param.endAt() != null ? param.endAt() : targetSchedule.getEndAt();

        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
    }

    private void validateScheduleOwner(Long scheduleId, Long ownerEmpId) {
        if(scheduleId == null || ownerEmpId == null) throw new RequiredValueMissingException();

        if(!scheduleRepository.existsScheduleByIdAndEmp_Id(scheduleId, ownerEmpId))
            throw new ScheduleOwnerNotMatchException();
    }

    private List<Schedule> registerManualSchedules(
            Long ownerId,
            ManualScheduleCreateRequest manual
    ) {
        Emp scheduleOwner = findActiveEmpById(empRepository, ownerId);
        String newSourceKey = UUID.randomUUID().toString();

        LocalDate startDate = manual.startAt().toLocalDate();
        LocalDate endDate  =  manual.endAt().toLocalDate();
        LocalTime startAt =  manual.startAt().toLocalTime();
        LocalTime endAt =   manual.endAt().toLocalTime();

        validateMultiDayScheduleTime(startDate, endDate, startAt, endAt);

        return ScheduleSupport.registerSchedule(
                port, startDate, endDate,
                startAt, endAt,
                ScheduleType.MANUAL,
                manual.title(), manual.content(),
                scheduleOwner,
                Set.of(),
                newSourceKey);
    }

    private void validateMultiDayScheduleTime(
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt
    ) {
        if(startDate.isBefore(endDate)
                && (startAt.isAfter(port.getEndTime()) || endAt.isBefore(port.getStartTime())))
            throw new ScheduleTimeOutsideCompanyHoursException();
    }

    private void validateManualSchedule(Schedule manual) {
        if(!manual.getScheduleType().equals(ScheduleType.MANUAL)) {
            throw new NotManualScheduleException();
        }
    }

}
