package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.AbstractEventAggregateRoot;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingCanceledEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingChangedEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingParticipantReplaceEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingReservedEvent;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = {"meetingRoom", "emp", "meetingParticipants"})
public class Meeting extends AbstractEventAggregateRoot {

    private MeetingRoom meetingRoom;

    private Emp emp;

    private String sourceKey;

    private String title;

    private LocalDate meetingDate;

    private LocalTime startAt;

    private LocalTime endAt;

    private boolean isCancel;

    private List<MeetingParticipant> meetingParticipants = new ArrayList<>();

    public static Meeting reserve(
            MeetingRoom meetingRoom,
            Emp reserver,
            String title,
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt,
            List<Emp> participants
    ) {
        requireNonNull(meetingRoom, "회의실 정보는 필수");
        requireNonNull(reserver, "예약자 정보는 필수");
        requireNonNull(title, "회의 제목은 필수");
        requireNonNull(meetingDate, "회의일자는 필수");
        requireNonNull(startAt, "시작시간은 필수");
        requireNonNull(endAt, "종료시간은 필수");
        requireNonNull(participants, "참가자 정보는 필수");

        state(!title.isBlank(), "회의 제목은 빈칸일 수 없음");
        state(startAt.isBefore(endAt), "종료시간은 시작시간보다 늦어야 함");
        state(!participants.isEmpty(), "회의 참가자는 비어있을 수 없음");

        Meeting meeting = new Meeting();
        meeting.meetingRoom = meetingRoom;
        meeting.emp = reserver;
        meeting.title = title;
        meeting.meetingDate = meetingDate;
        meeting.startAt = startAt;
        meeting.endAt = endAt;
        meeting.isCancel = false;
        meeting.sourceKey = UUID.randomUUID().toString();
        for (Emp participant : participants) {
            meeting.addParticipant(participant);
        }

        Set<Long> participantIds = getEmpIdsFromParticipants(meeting.meetingParticipants);
        meeting.issueMeetingReservedEvent(participantIds);

        return meeting;
    }

    public void cancel() {
        isEditableDate();

        state(!this.isCancel, "이미 취소된 예약임");
        this.isCancel = true;

        Set<Long> participantIds = getEmpIdsFromParticipants(this.meetingParticipants);
        this.issueMeetingCanceledEvent(participantIds);
    }

    public void changeReservationInfo(
            @Nullable LocalDate meetingDate,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            @Nullable MeetingRoom meetingRoom,
            @Nullable String title
    ) {
        isEditableDate();

        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");
        state(meetingDate != null || startAt != null || endAt != null || meetingRoom != null || title != null, "수정된 정보가 없음");

        this.startAt = startAt != null? startAt : this.startAt;
        this.endAt = endAt != null? endAt : this.endAt;
        state(this.endAt.isAfter(this.startAt), "종료시간은 시작시간보다 늦어야 함");

        this.meetingDate = meetingDate != null? meetingDate : this.meetingDate;

        this.meetingRoom = meetingRoom != null? meetingRoom : this.meetingRoom;

        if(title != null) {
            state(!title.isBlank(), "회의 title에 빈값이 올 수 없음");
            this.title = title;
        }

        editMeetingScheduleEvent();
    }

    public void changeParticipants(List<Emp> newParticipants) {
        isEditableDate();

        requireNonNull(newParticipants, "참여자 목록은 null일 수 없음");
        state(!newParticipants.isEmpty(), "참여자 목록은 비어 있을 수 없음");
        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");

        Set<Emp> newParticipantSet = new LinkedHashSet<>(newParticipants);
        Set<Emp> currentEmpSet = this.meetingParticipants.stream()
                .map(MeetingParticipant::getEmp)
                .collect(java.util.stream.Collectors.toSet());

        List<MeetingParticipant> removeTargets = this.meetingParticipants.stream()
                .filter(mp -> !newParticipantSet.contains(mp.getEmp())).toList();
        List<Emp> addTargets = newParticipantSet.stream()
                .filter(emp -> !currentEmpSet.contains(emp)).toList();
        if (removeTargets.isEmpty() && addTargets.isEmpty()) return;

        for (MeetingParticipant removeTarget : removeTargets) this.meetingParticipants.remove(removeTarget);

        for (Emp emp : addTargets) this.meetingParticipants.add(MeetingParticipant.create(this, emp));

        if (!removeTargets.isEmpty()) removeParticipantsEvent(getEmpIdsFromParticipants(removeTargets));

        if (!addTargets.isEmpty()) {
            Set<Long> empIdsFromParticipants = addTargets.stream().map(Emp::getId).collect(Collectors.toSet());

            addParticipantsEvent(empIdsFromParticipants);
        }
    }

    private void isEditableDate() {
        state(this.meetingDate.isAfter(LocalDate.now()), "익일 이후의 회의건만 수정가능");
    }

    private void addParticipant(Emp emp) {
        isEditableDate();

        requireNonNull(emp, "참여자는 null일 수 없음");
        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");

        boolean alreadyEnrolled = this.meetingParticipants.stream()
                .anyMatch(existing -> existing.getEmp().equals(emp));

        state(!alreadyEnrolled, "이미 등록된 참여자");

        MeetingParticipant participant = MeetingParticipant.create(this, emp);
        this.meetingParticipants.add(participant);
    }

    private static Set<Long> getEmpIdsFromParticipants(List<MeetingParticipant> participant) {
        return participant.stream()
                .map(p -> p.getEmp().getId()).collect(Collectors.toSet());
    }

    private void editMeetingScheduleEvent() {
        registerEvent(
                MeetingChangedEvent.builder()
                        .sourceKey(this.sourceKey)
                        .meetingRoomId(this.meetingRoom.getId())
                        .title(this.title)
                        .meetingDate(this.meetingDate)
                        .startAt(this.startAt)
                        .endAt(this.endAt)
                        .participantEmpIds(
                                getEmpIdsFromParticipants(
                                        this.meetingParticipants
                                )
                        )
                .build()
        );
    }

    private void issueMeetingReservedEvent(Set<Long> targetEmpIds) {
        registerEvent(
                MeetingReservedEvent.builder()
                        .sourceKey(this.sourceKey)
                        .meetingRoomId(this.meetingRoom.getId())
                        .reserverId(this.emp.getId())
                        .title(this.title)
                        .meetingDate(this.meetingDate)
                        .startAt(this.startAt)
                        .endAt(this.endAt)
                        .participantIds(targetEmpIds)
                        .build()
        );
    }

    private void issueMeetingCanceledEvent(Set<Long> targetEmpIds) {
        registerEvent(
                MeetingCanceledEvent.builder()
                        .sourceKey(this.sourceKey)
                        .participantIds(targetEmpIds)
                .build()
        );
    }

    private void removeParticipantsEvent(Set<Long> targetEmpIds) {
        registerEvent(
                MeetingParticipantReplaceEvent.builder()
                        .sourceKey(this.sourceKey)
                        .removedParticipantIds(targetEmpIds)
                .build()
        );
    }

    private void addParticipantsEvent(Set<Long> targetEmpIds) {
        registerEvent(
                MeetingParticipantReplaceEvent.builder()
                        .sourceKey(this.sourceKey)
                        .addParticipantIds(targetEmpIds)
                .build()
        );
    }


}
