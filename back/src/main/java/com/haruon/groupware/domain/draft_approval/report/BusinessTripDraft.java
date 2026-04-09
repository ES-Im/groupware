package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

@Entity
@Getter
@DiscriminatorValue("BUSINESS_TRIP")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessTripDraft extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String purpose;

    private BusinessTripDraft(Emp emp, String title, String content, Boolean isTemporary) {
        super(emp, title, content, isTemporary);
    }

    public static BusinessTripDraft submitBusinessTripDraft(
        Emp emp, String title, String content, Boolean isTemporary,
        LocalDateTime startAt, LocalDateTime endAt,
        String destination, String purpose
    ) {
        BusinessTripDraft draft = new BusinessTripDraft(emp, title, content, isTemporary);

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        requireNonNull(destination);
        requireNonNull(purpose);
        state(!destination.isBlank(), "목적지는 빈 값이 될 수 없음");
        state(!purpose.isBlank(), "출장목적은 빈 값이 될 수 없음");

        draft.startAt = startAt;
        draft.endAt = endAt;
        draft.destination = destination;
        draft.purpose = purpose;

        return draft;
    }

}
