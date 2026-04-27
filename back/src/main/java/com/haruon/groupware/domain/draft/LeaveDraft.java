package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.byLeaveApprove.LeaveApprovedEvent;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;

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

    @Column(nullable = false)
    private long reservedHours;

    private LeaveDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    @Override
    public void approve(Emp approver, LocalDateTime approvedAt) {
        super.approve(approver, approvedAt);
        boolean hasAllApproved = this.hasAllApproved();

        if(hasAllApproved) {
            LeaveApprovedEventRegister(this);
        }
    }

    public static LeaveDraft createDraft(
            Emp emp, String title, String content,
            LocalDateTime startAt, LocalDateTime endAt,
            LeaveType leaveType, List<ApproversParam> approvers,
            Long reservedHours
    ) {
        LeaveDraft draft = new LeaveDraft(title, content, emp);

        draft.init(startAt, endAt, leaveType, reservedHours);
        draft.createDraftApproval(approvers);

        return draft;
    }

    public static LeaveDraft createSubmitted(
            Emp emp, String title, String content,
            LocalDateTime startAt, LocalDateTime endAt,
            LeaveType leaveType, List<ApproversParam> approvers, LocalDateTime submittedAt,
            Long reservedHours
    ) {
        LeaveDraft submitted = new LeaveDraft(title, content, emp);

        submitted.init(startAt, endAt, leaveType, reservedHours);
        submitted.createSubmittedApproval(approvers, submittedAt);

        return submitted;
    }

    private static void LeaveApprovedEventRegister(LeaveDraft submitted) {
        submitted.registerEvent(
                LeaveApprovedEvent.builder()
                        .sourceKey(submitted.sourceKey)
                        .drafterEmpId(submitted.emp.getId())
                        .title(submitted.title)
                        .content(submitted.content)
                        .leaveStartAt(submitted.startAt)
                        .leaveEndAt(submitted.endAt)
                        .leaveType(submitted.leaveType)
                .build()
        );
    }

    public void editLeaveDraft(
            @Nullable String title,
            @Nullable String content,
            @Nullable LocalDateTime startAt,
            @Nullable LocalDateTime endAt,
            @Nullable LeaveType leaveType,
            @Nullable Long reservedHours
    ) {
        editDraft(title, content);

        LocalDateTime editedStartAt = startAt != null ? startAt : this.startAt;
        LocalDateTime editedEndAt = endAt != null ? endAt : this.endAt;
        LeaveType editedLeaveType = leaveType != null ? leaveType : this.leaveType;
        Long editedReservedHours = reservedHours != null ? reservedHours : this.reservedHours;

        validateLeaveInitParam(editedStartAt, editedEndAt, editedLeaveType, editedReservedHours);

        this.startAt = editedStartAt;
        this.endAt = editedEndAt;
        this.leaveType = editedLeaveType;
        this.reservedHours = editedReservedHours;
    }

    private static void validateLeaveInitParam(LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType, Long reservedHours) {
        requireNonNull(leaveType, "휴가 타입은 null일 수 없음");
        requireNonNull(startAt, "휴가 시작일시는 null일 수 없음");
        requireNonNull(endAt, "휴가 종료일시는 null일 수 없음");
        requireNonNull(reservedHours, "휴가 사용시간은 null일 수 없음");
        validateTime(startAt, endAt);
    }

    private void init(
            LocalDateTime startAt,
            LocalDateTime endAt,
            LeaveType leaveType,
            Long reservedHours
    ) {

        validateLeaveInitParam(startAt, endAt, leaveType, reservedHours);

        this.startAt = startAt;
        this.endAt = endAt;
        this.leaveType = leaveType;
        this.reservedHours = reservedHours;
    }



}
