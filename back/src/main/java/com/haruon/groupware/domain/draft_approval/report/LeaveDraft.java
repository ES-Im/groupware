package com.haruon.groupware.domain.draft_approval.report;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@DiscriminatorValue("LEAVE")
@Getter
public class LeaveDraft extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private Double usedDay;

    @Column(nullable = false)
    @Enumerated
    private LeaveType leaveType;

    // 캔슬할때 schedule.cancle() 메서드 소환
}
