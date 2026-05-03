package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.schedule.provided.ScheduleEditing;
import com.haruon.groupware.application.schedule.provided.ScheduleRegister;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meeting.Meeting;
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
import java.util.UUID;

import static com.haruon.groupware.application.utils.Utils.getEmpListById;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@AllArgsConstructor
@Service
@Transactional
public class ScheduleService implements ScheduleRegister, ScheduleEditing {

    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;
    private final DraftRepository draftRepository;
    private final EmpRepository empRepository;
    private final MeetingRepository meetingRepository;

    @Override
    public String registerSchedules(ScheduleCreateRequest param) {
        requireNonNull(param);

        boolean isPublic = param.isPublic();

        List<Schedule> schedules;

        if(param.manualScheduleParam() != null) {
            schedules = registerManualSchedules(
                    param.manualScheduleParam(), isPublic
            );

            return scheduleRepository.saveAll(schedules).getFirst().getSourceKey();
        }


        Meeting meeting = meetingRepository.findBySourceKey(param.sourceKey()).orElse(null);
        if (meeting != null) {
            schedules = registerMeetingSchedules(meeting, isPublic);

            return scheduleRepository.saveAll(schedules).getFirst().getSourceKey();
        }


        Draft draft = draftRepository.findBySourceKey(param.sourceKey()).orElseThrow(
                () -> new IllegalArgumentException("지원하지 않는 일정 타입")
        );

        if (draft instanceof LeaveDraft leaveDraft) {
            schedules = registerLeaveSchedules(leaveDraft, isPublic);
        } else if (draft instanceof BusinessTripDraft businessTripDraft) {
            schedules = registerBusinessTripSchedules(businessTripDraft, isPublic);
        } else {
            throw new IllegalArgumentException("지원하지 않는 일정 타입");    // to-do 커스텀 예외처리
        }

        return scheduleRepository.saveAll(schedules).getFirst().getSourceKey();
    }

    @Override
    public void addParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {
        Schedule schedule = getScheduleById(scheduleId);

        List<Emp> empList = getEmpListById(empRepository, participantEmpIds);

        empList.forEach(Emp::ensureActive);

        List<Schedule> targetSchedules = isForBulkEdit
                ? getSameEventSchedules(schedule.getSourceKey())
                : List.of(schedule);

        if(isForBulkEdit) {
            targetSchedules.forEach(targetSchedule ->
                    empList.forEach(targetSchedule::addParticipant)
            );
        } else {
            empList.forEach(schedule::addParticipant);
        }
    }


    @Override
    public void removeParticipants(Long scheduleId, Set<Long> participantEmpIds, boolean isForBulkEdit) {

        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);

        List<Emp> empList = getEmpListById(empRepository, participantEmpIds);

        for (Schedule targetSchedule : targetSchedules) {
            for (Emp emp : empList) {
                targetSchedule.removeParticipant(emp);
            }
        }

    }

    @Override
    public void cancelSchedule(Long scheduleId, boolean isForBulkEdit) {
        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);

        targetSchedules.forEach(Schedule::cancel);
    }

    @Override
    public void updateManualSchedule(Long scheduleId, boolean isForBulkEdit, ManualScheduleParam param) {
        List<Schedule> targetSchedules = getSchedules(scheduleId, isForBulkEdit);

        for (Schedule targetSchedule : targetSchedules) {
            targetSchedule.changeManualSchedule(
                    param.title(), param.content(), param.startAt().toLocalTime(), param.endAt().toLocalTime()
            );
        }
    }

    private List<Schedule> getSchedules(Long scheduleId, boolean isForBulkEdit) {
        Schedule schedule = getScheduleById(scheduleId);

        return isForBulkEdit
                ? getSameEventSchedules(schedule.getSourceKey())
                : List.of(schedule);
    }

    private Schedule getScheduleById(Long scheduleId) {
        return scheduleRepository
                .findById(scheduleId)
                .orElseThrow(() ->
                        new IllegalArgumentException("대상 일정이 없음")      // to-do : 커스텀 예외 처리
                );
    }

    private List<Schedule> getSameEventSchedules(String sourceKey) {
        List<Schedule> schedules = scheduleRepository.findSchedulesBySourceKey(sourceKey);

        state(!schedules.isEmpty(), "검색된 일정이 없음");

        return schedules;
    }

    private List<Schedule> registerManualSchedules(
            ManualScheduleParam manual,
            boolean isPublic
    ) {

        String newSourceKey = UUID.randomUUID().toString();

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
                isPublic,
                newSourceKey);
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
                meeting.getSourceKey());
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
                businessTripDraft.getSourceKey());
    }

    private List<Schedule> registerLeaveSchedules(
            LeaveDraft leaveDraft,
            boolean isPublic
    ) {

        LocalDate startDate = leaveDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  leaveDraft.getEndAt().toLocalDate();
        LocalTime startAt =  leaveDraft.getStartAt().toLocalTime();
        LocalTime endAt =   leaveDraft.getEndAt().toLocalTime();

        String title = leaveDraft.getLeaveType().getDescription();
        String content = String.format(
                "연가 종류: %s%n시작일시: %s%n종료일시: %s%n사유: %s",
                leaveDraft.getLeaveType().getDescription(),
                leaveDraft.getStartAt(),
                leaveDraft.getEndAt(),
                leaveDraft.getTitle()
        );

        return registerSchedule(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.LEAVE,
                title, content,
                leaveDraft.getEmp(),
                isPublic,
                leaveDraft.getSourceKey());
    }

    private List<Schedule> registerSchedule(
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt,
            ScheduleType type,
            String title, String content,
            Emp scheduleOwner,
            boolean isPublic,
            String sourceKey
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
                    sourceKey,
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
