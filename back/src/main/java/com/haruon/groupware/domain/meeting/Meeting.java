package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.AbstractEventAggregateRoot;
import com.haruon.groupware.domain.event.byMeetingReservation.AssignEmpToMeetingScheduleEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.UnassignEmpToMeetingScheduleEvent;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Meeting extends AbstractEventAggregateRoot {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="reserver_id",  nullable = false)
    private Emp emp;

    @Column(unique = true, nullable = false, updatable = false)
    private String sourceKey;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate meetingDate;

    @Column(nullable = false)
    private LocalTime startAt;

    @Column(nullable = false)
    private LocalTime endAt;

    private boolean isCancel;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
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

        List<Long> participantIds = getEmpIdsFromParticipants(meeting.meetingParticipants);
        meeting.assignEmpToMeetingScheduleEvent(participantIds);

        return meeting;
    }

    public void addParticipant(Emp emp) {
        requireNonNull(emp, "참여자는 null일 수 없음");
        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");

        boolean alreadyEnrolled = this.meetingParticipants.stream()
                .anyMatch(existing -> existing.getEmp().equals(emp));

        state(!alreadyEnrolled, "이미 등록된 참여자");

        MeetingParticipant participant = MeetingParticipant.create(this, emp);
        this.meetingParticipants.add(participant);

        List<Long> newParticipantId = List.of(participant.getEmp().getId());
        this.assignEmpToMeetingScheduleEvent(newParticipantId);
    }

    public void removeParticipant(Emp emp) {
        requireNonNull(emp, "참여자는 null일 수 없음");
        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");

        MeetingParticipant removeTarget = this.meetingParticipants.stream()
                                .filter(m -> m.getEmp().equals(emp))
                                .findFirst().orElseThrow(() -> new IllegalArgumentException("대상 참여자를 찾을 수 없음"));

        this.meetingParticipants.remove(removeTarget);
        List<Long> targetId = List.of(removeTarget.getId());
        this.unAssignEmpToMeetingScheduleEvent(targetId);
    }

    public void cancel() {
        state(!this.isCancel, "이미 취소된 예약임");
        this.isCancel = true;

        List<Long> participantIds = getEmpIdsFromParticipants(this.meetingParticipants);
        this.unAssignEmpToMeetingScheduleEvent(participantIds);
    }

    public void changeReservation(        // 이벤트 발행 필요
            @Nullable LocalDate meetingDate,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            @Nullable MeetingRoom meetingRoom,
            @Nullable String title
    ) {
        state(!this.isCancel, "취소된 회의 정보를 수정할 수 없음");

        this.startAt = startAt != null? startAt : this.startAt;
        this.endAt = endAt != null? endAt : this.endAt;
        state(this.endAt.isAfter(this.startAt), "종료시간은 시작시간보다 늦어야 함");

        this.meetingDate = meetingDate != null? meetingDate : this.meetingDate;

        this.meetingRoom = meetingRoom != null? meetingRoom : this.meetingRoom;

        if(title != null) {
            state(!title.isBlank(), "회의 title에 빈값이 올 수 없음");
            this.title = title;
        }
    }

    private void assignEmpToMeetingScheduleEvent(
            List<Long> targetEmpIds
    ) {
        registerEvent(
                AssignEmpToMeetingScheduleEvent.builder()
                        .sourceKey(this.sourceKey)
                        .meetingRoomId(this.meetingRoom.getId())
                        .reserverId(this.emp.getId())
                        .title(this.title)
                        .meetingDate(this.meetingDate)
                        .startAt(this.startAt)
                        .endAt(this.endAt)
                        .participantsId(targetEmpIds)
                        .build()
        );
    }
    private void unAssignEmpToMeetingScheduleEvent(
            List<Long> targetEmpIds
    ) {
        registerEvent(
                UnassignEmpToMeetingScheduleEvent.builder()
                        .sourceKey(this.sourceKey)
                        .meetingRoomId(this.getId())
                        .participantsId(targetEmpIds)
                .build()
        );
    }


    private static List<Long> getEmpIdsFromParticipants(List<MeetingParticipant> participant) {
        return participant.stream()
                .map(p -> p.getEmp().getId())
                .toList();
    }



}
