package com.haruon.groupware.domain.meetingroom;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Meeting extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="reserver_id",  nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private String title;

    private LocalDate meetingDate;

    private LocalTime startAt;

    private LocalTime endAt;

    private boolean isCancelled;

    // 캔슬할때 schedule.cancle() 메서드 소환
}
