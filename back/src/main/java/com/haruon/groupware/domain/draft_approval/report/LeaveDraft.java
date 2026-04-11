package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

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
    @Enumerated(EnumType.STRING)
    private LeaveType leaveType;

    private LeaveDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static LeaveDraft createDraft(
            Emp emp, String title, String content,
            LocalDateTime startAt, LocalDateTime endAt,
            LeaveType leaveType, List<ApproversParam> approvers
    ) {
        LeaveDraft draft = new LeaveDraft(title, content, emp);

        draft.init(startAt, endAt, leaveType);
        draft.createDraftApproval(approvers);

        return draft;
    }

    public static LeaveDraft createSubmitted(
            Emp emp, String title, String content,
            LocalDateTime startAt, LocalDateTime endAt,
            LeaveType leaveType, List<ApproversParam> approvers, LocalDateTime submittedAt
    ) {
        LeaveDraft draft = new LeaveDraft(title, content, emp);

        draft.init(startAt, endAt, leaveType);
        draft.createSubmittedApproval(approvers, submittedAt);

        return draft;
    }

    public void editLeaveDraft(
            @Nullable String title,
            @Nullable String content,
            @Nullable LocalDateTime startAt,
            @Nullable LocalDateTime endAt,
            @Nullable LeaveType leaveType
    ) {
        editDraft(title, content);

        LocalDateTime editedStartAt = startAt != null ? startAt : this.startAt;
        LocalDateTime editedEndAt = endAt != null ? endAt : this.endAt;
        LeaveType editedLeaveType = leaveType != null ? leaveType : this.leaveType;

        validateLeaveInitParam(editedStartAt, editedEndAt, editedLeaveType);

        this.startAt = editedStartAt;
        this.endAt = editedEndAt;
        this.leaveType = editedLeaveType;
    }

    private static void validateLeaveInitParam(LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType) {
        requireNonNull(leaveType, "휴가 타입은 null일 수 없음");
        requireNonNull(startAt, "휴가 시작일시는 null일 수 없음");
        requireNonNull(endAt, "휴가 종료일시는 null일 수 없음");
        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");

        state(startAt.getMinute() == 0 && startAt.getSecond() == 0 && startAt.getNano() == 0,
                "휴가 시작시각은 정각이어야 한다.");
        state(endAt.getMinute() == 0 && endAt.getSecond() == 0 && endAt.getNano() == 0,
                "휴가 종료시각은 정각이어야 한다.");
    }

    private void init(
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType
    ) {

        validateLeaveInitParam(startAt, endAt, leaveType);

        this.startAt = startAt;
        this.endAt = endAt;
        this.leaveType = leaveType;
    }



}
