package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.event.byLeaveApprove.LeaveCancelledEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;

class EmpLeaveCancelDraftTest {

    @Test
    @DisplayName("연가취소 미상신 기안서 생성 테스트")
    void create_cancel_Draft() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        LeaveDraft approved = getApproved(drafter);
        LeaveCancelDraft cancelDraft = LeaveCancelDraft.createDraft(drafter, "test", "test", approved.getSourceKey(), List.of());

        assertThat(cancelDraft.getSourceKey()).isEqualTo(approved.getSourceKey());
    }

    @Test
    @DisplayName("연가취소 상신 기안서 생성 테스트")
    void publish_cancel_leave_when_cancel_draft_approved() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        LeaveDraft approved = getApproved(drafter);
        LeaveCancelDraft cancelSubmitted = LeaveCancelDraft.createSubmitted(drafter, "test", "test", approved.getSourceKey(), List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp())), LocalDateTime.of(2026,4,1,1,1,1));


        assertThat(cancelSubmitted.getSourceKey()).isEqualTo(approved.getSourceKey());
    }

    @Test
    @DisplayName("연가취소기안이 결재완료되면, 연가일정취소 이벤트가 발행")
    void create_cancel_submitted() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        LeaveDraft approved = getApproved(drafter);
        String sourceKey = approved.getSourceKey();
        ApproversParam approversParam = new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp());
        LeaveCancelDraft cancelSubmitted = LeaveCancelDraft.createSubmitted(drafter, "test", "test", sourceKey, List.of(approversParam), LocalDateTime.of(2026,4,1,1,1,1));

        cancelSubmitted.approve(approversParam.approver(), LocalDateTime.of(2026,5,1,0,0,0));

        DomainEvent domainEvent = cancelSubmitted.domainEvents().getFirst();

        assertThat(domainEvent).isExactlyInstanceOf(LeaveCancelledEvent.class);
        LeaveCancelledEvent leaveCancelEvent = (LeaveCancelledEvent) domainEvent;
        assertThat(leaveCancelEvent.sourceKey()).isEqualTo(sourceKey);
    }

    private LeaveDraft getApproved(Emp drafter) {
        Emp approver1 = getApprovedEmp("202601002", "approver1");
        Emp approver2 = getApprovedEmp("202601003", "approver2");
        ApproversParam approverParam1 = new ApproversParam(ApprovalRole.APPROVER, 1, approver1);
        ApproversParam approverParam2 = new ApproversParam(ApprovalRole.APPROVER, 2, approver2);
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 20,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 21, 0,0,0);
        LeaveType type = LeaveType.ANNUAL;

        LeaveDraft submitted = LeaveDraft.createSubmitted(
                drafter, "title", "content", startAt, endAt, type, List.of(approverParam1, approverParam2), LocalDateTime.of(2026, 4, 16, 9, 0)
        );

        submitted.approve(approver1, LocalDateTime.of(2026, 4, 20,0,0,0));
        submitted.approve(approver2, LocalDateTime.of(2026, 4, 20,0,0,0));

        return submitted;
    }

}