package com.haruon.groupware.domain.meetingroom;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Meeting extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="reserver_id",  nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate meetingDate;

    @Column(nullable = false)
    private LocalTime startAt;

    @Column(nullable = false)
    private LocalTime endAt;

    private boolean isCancel;

    public static Meeting reserve(
            MeetingRoom meetingRoom,
            Emp reserver,
            String title,
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt
    ) {
        requireNonNull(meetingRoom, "회의실 정보는 필수");
        requireNonNull(reserver, "예약자 정보는 필수");
        requireNonNull(title, "회의 제목은 필수");
        requireNonNull(meetingDate, "회의일자는 필수");
        requireNonNull(startAt, "시작시간은 필수");
        requireNonNull(endAt, "종료시간은 필수");

        state(!title.isBlank(), "회의 제목은 빈칸일 수 없음");
        state(startAt.isBefore(endAt), "종료시간은 시작시간보다 늦어야 함");

        Meeting meeting = new Meeting();
        meeting.meetingRoom = meetingRoom;
        meeting.emp = reserver;
        meeting.title = title;
        meeting.meetingDate = meetingDate;
        meeting.startAt = startAt;
        meeting.endAt = endAt;
        meeting.isCancel = false;

        return meeting;
    }

    public void cancel() {
        state(!this.isCancel, "이미 취소된 예약임");
        this.isCancel = true;
    }

    public void changeReservation(
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt
    ) {
        state(!this.isCancel, "취소된 예약은 변경할 수 없음");

        requireNonNull(meetingDate, "회의일자는 필수");
        requireNonNull(startAt, "시작시간은 필수");
        requireNonNull(endAt, "종료시간은 필수");

        state(startAt.isBefore(endAt), "종료시간은 시작시간보다 늦어야 함");

        this.meetingDate = meetingDate;
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public void changeTitle(String title) {
        state(!this.isCancel, "취소된 예약은 변경할 수 없음");

        requireNonNull(title, "회의 제목은 필수");
        state(!title.isBlank(), "회의 제목은 빈칸일 수 없음");

        this.title = title;
    }

}
