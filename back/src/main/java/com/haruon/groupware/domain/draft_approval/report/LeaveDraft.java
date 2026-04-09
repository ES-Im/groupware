package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@DiscriminatorValue("LEAVE")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LeaveDraft extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private double usedDay;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private LeaveType leaveType;

    public static LeaveDraft createDraft(
            Emp emp,
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            double usedDay,
            LeaveType leaveType,
            List<ApproversParam> approvers
    ) {
        LeaveDraft draft = new LeaveDraft(title, content, emp);

        draft.init(startAt, endAt, usedDay, leaveType);
        draft.createDraftApproval(approvers);

        return draft;
    }

    public static LeaveDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            double usedDay,
            LeaveType leaveType,
            List<ApproversParam> approvers,
            LocalDateTime submittedAt
    ) {
        LeaveDraft draft = new LeaveDraft(title, content, emp);

        draft.init(startAt, endAt, usedDay, leaveType);
        draft.createSubmittedApproval(approvers, submittedAt);

        return draft;
    }

    private LeaveDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    private void init(
            LocalDateTime startAt, LocalDateTime endAt,
            Double usedDay, LeaveType leaveType
    ) {
        requireNonNull(startAt, "출장 시작일시는 null일 수 없음");
        requireNonNull(endAt, "출장 종료일시는 null일 수 없음");
        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");

        requireNonNull(usedDay);
        state(usedDay > 0, "사용일수는 0보다 커야한다.");
        state(usedDay % 0.5 == 0, "사용일수는 0.5 단위여야 한다.");
        requireNonNull(leaveType);

        this.startAt = startAt;
        this.endAt = endAt;
        this.usedDay = usedDay;
        this.leaveType = leaveType;
    }
}
