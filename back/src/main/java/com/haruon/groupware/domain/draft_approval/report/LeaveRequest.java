package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

@Entity
@DiscriminatorValue("LEAVE")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LeaveRequest extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private double usedDay;

    @Column(nullable = false)
    @Enumerated
    private LeaveType leaveType;

    private LeaveRequest(Emp emp, String title, String content, Boolean isTemporary) {
        super(emp, title, content, isTemporary);
    }

    public static LeaveRequest submitLeaveRequestDraft(
            Emp emp, String title, String content, Boolean isTemporary,
            LocalDateTime startAt, LocalDateTime endAt,
            Double usedDay, LeaveType leaveType
    ) {
        LeaveRequest draft = new LeaveRequest(emp, title, content, isTemporary);

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        requireNonNull(usedDay);
        requireNonNull(leaveType);

        draft.startAt = startAt;
        draft.endAt = endAt;
        draft.usedDay = usedDay;
        draft.leaveType = leaveType;

        return draft;
    }
}
