package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.provided.ScheduleEditing;
import com.haruon.groupware.application.schedule.provided.ScheduleRegister;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.schedule.service.dto.ManualScheduleParam;
import com.haruon.groupware.application.schedule.service.dto.ScheduleParam;
import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.LeaveDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meetingroom.Meeting;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.Utils.getEmpListById;
import static java.util.Objects.requireNonNull;

@AllArgsConstructor
@Service
@Transactional
public class ScheduleService implements ScheduleRegister, ScheduleEditing {

    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;
    private final EmpRepository empRepository;

    @Override
    public int registerSchedules(ScheduleParam param) {
        requireNonNull(param);

        List<Schedule> schedules = null;

        boolean isPublic = param.isPublic();

        if (param.leaveDraft() != null) {
            schedules = registerLeaveSchedules(param.leaveDraft(), isPublic);
        } else if (param.businessTripDraft() != null) {
            schedules = registerBusinessTripSchedules(param.businessTripDraft(), isPublic);
        } else if (param.meeting() != null) {
            schedules = registerMeetingSchedules(param.meeting(), isPublic);
        } else {
            schedules = registerManualSchedules(requireNonNull(param.manual()), isPublic);
        }

        List<Schedule> result = scheduleRepository.saveAll(schedules);

        return result.size();
    }

    @Override
    public int addParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        int result = 0;

        Schedule schedule = getScheduleById(scheduleId);

        List<Emp> empList = getEmpListById(empRepository, participantEmpIds);

        List<Schedule> targetSchedules = isForBulkEdit
                ? getSameEventSchedules(schedule.getSourceId(), schedule.getScheduleType())
                : List.of(schedule);

        for (Schedule targetSchedule : targetSchedules) {
            for (Emp emp : empList) {
                emp.ensureActive();
                result += targetSchedule.addParticipant(emp);
            }
        }

        return result;
    }


    @Override
    public int removeParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        int result = 0;

        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);

        List<Emp> empList = getEmpListById(empRepository, participantEmpIds);

        for (Schedule targetSchedule : targetSchedules) {
            for (Emp emp : empList) {
                result += targetSchedule.removeParticipant(emp);
            }
        }

        return result;
    }

    @Override
    public int cancelSchedule(Long scheduleId, boolean isForBulkEdit) {
        int result = 0;

        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);

        for (Schedule targetSchedule : targetSchedules) {
            result += targetSchedule.cancel();
        }

        return result;
    }

    @Override
    public int updateManualSchedule(Long scheduleId, boolean isForBulkEdit, ManualScheduleParam param) {
        int result = 0;

        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);
        for (Schedule targetSchedule : targetSchedules) {
            result += targetSchedule.changeManualSchedule(
                    param.title(), param.content(), param.startAt().toLocalTime(), param.endAt().toLocalTime()
            );
        }

        return result;
    }

    private List<Schedule> getSchedules(Long scheduleId, boolean isForBulkEdit) {
        Schedule schedule = getScheduleById(scheduleId);
        ScheduleType scheduleType = schedule.getScheduleType();

        return isForBulkEdit
                ? getSameEventSchedules(schedule.getSourceId(), scheduleType)
                : List.of(schedule);

    }

    private Schedule getScheduleById(Long scheduleId) {
        return scheduleRepository
                .findById(scheduleId)
                .orElseThrow(() ->
                        new IllegalArgumentException("대상 일정이 없음")      // to-do : 커스텀 예외 처리
                );
    }

    private List<Schedule> getSameEventSchedules(Long sourceId, ScheduleType type) {
        return scheduleRepository
                .findByScheduleTypeAndSourceId(type, sourceId)
                .orElse(List.of());
    }

    private List<Schedule> registerManualSchedules(
            ManualScheduleParam manual,
            boolean isPublic
    ) {

        Long lastSourceId = scheduleRepository.findLastManualSourceId();
        Long nextSourceId = (lastSourceId == null) ? 1L : lastSourceId + 1;

        LocalDate startDate = manual.startAt().toLocalDate();
        LocalDate endDate  =  manual.endAt().toLocalDate();
        LocalTime startAt =  manual.startAt().toLocalTime();
        LocalTime endAt =   manual.endAt().toLocalTime();

        String title = manual.title();

        String content = String.format(
                "날짜: %s - %s%n시각: %s - %s%n내용: %s",
                startDate, endDate,
                startAt, endAt,
                manual.content()
        );

        return registerSchedule(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.MANUAL,
                title, content,
                manual.owner(),
                isPublic, nextSourceId);
    }

    private List<Schedule> registerMeetingSchedules(
            Meeting meeting,
            boolean isPublic
    ) {

        String title = meeting.getTitle();
        String content = String.format(
                "날짜: %s%n시각: %s - %s%n장소: %s%n회의건: %s",
                meeting.getMeetingDate(),
                meeting.getStartAt(),
                meeting.getEndAt(),
                meeting.getMeetingRoom().getName(),
                meeting.getTitle()
        );

        return registerSchedule(
                meeting.getMeetingDate(), meeting.getMeetingDate(),
                meeting.getStartAt(), meeting.getEndAt(),
                ScheduleType.MEETING,
                title, content,
                meeting.getEmp(),
                isPublic,
                meeting.getId());
    }

    private List<Schedule> registerBusinessTripSchedules(
            BusinessTripDraft businessTripDraft,
            boolean isPublic
    ) {

        LocalDate startDate = businessTripDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  businessTripDraft.getEndAt().toLocalDate();
        LocalTime startAt =  businessTripDraft.getStartAt().toLocalTime();
        LocalTime endAt =   businessTripDraft.getEndAt().toLocalTime();

        String title = businessTripDraft.getTitle();
        String content = String.format(
                "시작일시: %s%n종료일시: %s%n출장지: %s%n출장목적: %s",
                businessTripDraft.getStartAt(),
                businessTripDraft.getEndAt(),
                businessTripDraft.getDestination(),
                businessTripDraft.getPurpose()
        );

        return registerSchedule(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.BUSINESS_TRIP,
                title, content,
                businessTripDraft.getEmp(),
                isPublic,
                businessTripDraft.getId());
    }

    private List<Schedule> registerLeaveSchedules(
            LeaveDraft leaveDraft,
            boolean isPublic
    ) {

        LocalDate startDate = leaveDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  leaveDraft.getEndAt().toLocalDate();
        LocalTime startAt =  leaveDraft.getStartAt().toLocalTime();
        LocalTime endAt =   leaveDraft.getEndAt().toLocalTime();
        String reason = (leaveDraft.getContent() != null)? leaveDraft.getContent() : leaveDraft.getLeaveType().getDescription();

        String title = leaveDraft.getLeaveType().getDescription();
        String content = String.format(
                "연가 종류: %s%n시작일시: %s%n종료일시: %s%n사유: %s",
                leaveDraft.getLeaveType().getDescription(),
                leaveDraft.getStartAt(),
                leaveDraft.getEndAt(),
                reason
        );

        return registerSchedule(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.LEAVE,
                title, content,
                leaveDraft.getEmp(),
                isPublic,
                leaveDraft.getId());
    }

    private List<Schedule> registerSchedule(
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt,
            ScheduleType type,
            String title, String content,
            Emp scheduleOwner,
            boolean isPublic,
            Long sourceId
    ) {
        scheduleOwner.ensureActive();
        List<Schedule> schedules = new ArrayList<>();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for (int i = 0; i <= days; i++) {
            LocalDate targetDate = startDate.plusDays(i);

            TimeRange timeRange = getTimesPerDay(
                    startDate, endDate, targetDate,
                    startAt, endAt
            );

            Schedule schedule = Schedule.registerSchedule(
                    sourceId,
                    type,
                    scheduleOwner,
                    title, content,
                    targetDate,
                    timeRange.startAt(), timeRange.endAt(),
                    timeRange.isAllDay(),
                    isPublic
            );

            schedule.addParticipant(scheduleOwner);
            schedules.add(schedule);
        }

        return schedules;
    }

    private TimeRange getTimesPerDay(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate targetDate,
            LocalTime startAt,
            LocalTime endAt
    ) {
        if (startDate.equals(endDate)) {
            return new TimeRange(
                    startAt,
                    endAt,
                    startAt.equals(port.getStartTime()) && endAt.equals(port.getEndTime())
            );
        }

        if (targetDate.equals(startDate)) {
            return new TimeRange(
                    startAt,
                    port.getEndTime(),
                    startAt.equals(port.getStartTime())
            );
        }

        if (targetDate.equals(endDate)) {
            return new TimeRange(
                    port.getStartTime(),
                    endAt,
                    endAt.equals(port.getEndTime())
            );
        }

        return new TimeRange(port.getStartTime(), port.getEndTime(), true);
    }


    private record TimeRange(
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }
}
