package com.haruon.groupware.domain.draft_approval.report;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
@DiscriminatorValue("BUSINESS_TRIP")
public class BusinessTripDraft extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String purpose;

    // 캔슬할때 schedule.cancle() 메서드 소환

}
