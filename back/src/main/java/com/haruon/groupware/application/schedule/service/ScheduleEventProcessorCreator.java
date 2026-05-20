package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.schedule.EditForbiddenScheduleException;
import com.haruon.groupware.application.exception.schedule.UnsupportedScheduleTypeException;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.schedule.contentFormatter.BusinessTripScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.LeaveScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.MeetingScheduleContentDto;
import com.haruon.groupware.application.schedule.contentFormatter.ScheduleContentFormatter;
import com.haruon.groupware.application.schedule.provided.ScheduleEventProcessor;
import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.BusinessTripParticipant;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingParticipant;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.schedule.service.ScheduleSupport.getSchedulesBySourceKey;
import static com.haruon.groupware.application.schedule.service.ScheduleSupport.registerSchedule;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduleEventProcessorCreator implements ScheduleEventProcessor {

    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;
    private final DraftRepository draftRepository;
    private final EmpRepository empRepository;
    private final MeetingRepository meetingRepository;
    private final ScheduleQueryRepository scheduleQueryRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyScheduleCreation(String sourceKey) {
        List<Schedule> schedules;

        Meeting meeting = meetingRepository.findBySourceKey(sourceKey).orElse(null);
        if (meeting != null) {
//            log.info("미팅 확인 meetingId={}, sourceKey={}", meeting.getId(), sourceKey);
            schedules = registerMeetingSchedules(meeting);
//            log.info("등록확인 schedules size={}", schedules.size());    // 1
            scheduleRepository.saveAll(schedules);
//            log.info("DB저장확인 schedules size={}", scheduleRepository.findBySourceKey(sourceKey).size()); <- 여기서 안됨 트랜잭션 문제??
            return;
        }

        Draft draft = draftRepository.findBySourceKey(sourceKey)
                .stream().findFirst()
                .orElseThrow(UnsupportedScheduleTypeException::new);

        if (draft instanceof LeaveDraft leaveDraft) {
            schedules = registerLeaveSchedules(leaveDraft);
        } else if (draft instanceof BusinessTripDraft businessTripDraft) {
            schedules = registerBusinessTripSchedules(businessTripDraft);
        } else {
            throw new UnsupportedScheduleTypeException();
        }

        scheduleRepository.saveAll(schedules);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyParticipantAddition(String sourceKey, Set<Long> participantEmpIds) {
        List<Schedule> schedules = getSchedulesBySourceKey(scheduleRepository, sourceKey);
//
//        schedules.forEach(s -> log.info(
//                "schedule before - found participantIds={}\n", scheduleQueryRepository.findScheduleParticipantsByScheduleId(s.getId()))
//        );  // 기존 참가자 1(여기서 1명 삭제됌)

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

//        participantEmpIds.forEach(id -> log.info("request participants - found participantIds={}", id)); // 3331

        schedules.forEach(targetSchedule -> {
                if(!targetSchedule.getScheduleType().equals(ScheduleType.MEETING)) {
                    throw new EditForbiddenScheduleException();
                }

                empList.forEach(targetSchedule::addParticipant);
        });

        schedules.forEach(s -> log.info(
                "schedule after - found participantIds={}\n", scheduleQueryRepository.findScheduleParticipantsByScheduleId(s.getId()))
        );  // 3329, 3331
        scheduleRepository.saveAll(schedules);
    }


    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyParticipantRemoval(String sourceKey, Set<Long> participantEmpIds) {
        List<Schedule> schedules = getSchedulesBySourceKey(scheduleRepository, sourceKey);

        List<Emp> empList = findEmpListById(empRepository, participantEmpIds);

        schedules.forEach(targetSchedule ->
                empList.forEach(targetSchedule::removeParticipant)
        );

        scheduleRepository.saveAll(schedules);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyScheduleCancellation(String sourceKey) {
        List<Schedule> schedules = getSchedulesBySourceKey(scheduleRepository, sourceKey);

        schedules.forEach(Schedule::cancel);
//        log.info("save전 schedules 전체취소 여부 = {}", schedules.stream().allMatch(Schedule::isCanceled) );
        scheduleRepository.saveAll(schedules);
    }

    private List<Schedule> registerMeetingSchedules(
            Meeting meeting
    ) {
        String title = meeting.getTitle();

        String content = ScheduleContentFormatter.format(
                new MeetingScheduleContentDto(meeting.getMeetingRoom().getName(), title)
        );

        Set<Emp> participants = meeting.getMeetingParticipants().stream()
                .map(MeetingParticipant::getEmp)
                .collect(Collectors.toSet());


        return registerSchedule(
                port, meeting.getMeetingDate(), meeting.getMeetingDate(),
                meeting.getStartAt(), meeting.getEndAt(),
                ScheduleType.MEETING,
                title, content,
                meeting.getEmp(),
                participants,
                meeting.getSourceKey()
        );


    }

    private List<Schedule> registerBusinessTripSchedules(
            BusinessTripDraft businessTripDraft
    ) {
        LocalDate startDate = businessTripDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  businessTripDraft.getEndAt().toLocalDate();
        LocalTime startAt =  businessTripDraft.getStartAt().toLocalTime();
        LocalTime endAt =   businessTripDraft.getEndAt().toLocalTime();


        String content = ScheduleContentFormatter.format(
                new BusinessTripScheduleContentDto(
                        businessTripDraft.getDestination(),
                        businessTripDraft.getPurpose()
                )
        );

        Set<Emp> tripParticipants = businessTripDraft.getParticipants().stream()
                .map(BusinessTripParticipant::getEmp)
                .collect(Collectors.toSet());

        return registerSchedule(
                port, startDate, endDate,
                startAt, endAt,
                ScheduleType.BUSINESS_TRIP,
                content, content,
                businessTripDraft.getEmp(),
                tripParticipants,
                businessTripDraft.getSourceKey());
    }

    private List<Schedule> registerLeaveSchedules(
            LeaveDraft leaveDraft
    ) {

        LocalDate startDate = leaveDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  leaveDraft.getEndAt().toLocalDate();
        LocalTime startAt =  leaveDraft.getStartAt().toLocalTime();
        LocalTime endAt =   leaveDraft.getEndAt().toLocalTime();

        String title = leaveDraft.getLeaveType().getDescription();
        String content = ScheduleContentFormatter.format(
                new LeaveScheduleContentDto(leaveDraft.getLeaveType().getDescription())
        );

        return registerSchedule(
                port, startDate, endDate,
                startAt, endAt,
                ScheduleType.LEAVE,
                title, content,
                leaveDraft.getEmp(),
                Set.of(),
                leaveDraft.getSourceKey());
    }

}
