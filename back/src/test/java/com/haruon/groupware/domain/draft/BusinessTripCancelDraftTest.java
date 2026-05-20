package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.event.schedule.ScheduleCancellationEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;

class BusinessTripCancelDraftTest {

    @Test
    @DisplayName("출장취소 미상신 기안서 생성 테스트")
    void create_cancel_Draft() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        BusinessTripDraft approved = getApproved(drafter);
        BusinessTripCancelDraft cancelDraft = BusinessTripCancelDraft.createDraft(drafter, "test", "test", approved.getSourceKey(), List.of());

        assertThat(cancelDraft.getSourceKey()).isEqualTo(approved.getSourceKey());
    }

    @Test
    @DisplayName("출장취소 상신 기안서 생성 테스트")
    void publish_cancel_BusinessTrip_when_cancel_draft_approved() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        BusinessTripDraft approved = getApproved(drafter);
        BusinessTripCancelDraft cancelSubmitted = BusinessTripCancelDraft.createSubmitted(drafter, "test", "test", approved.getSourceKey(), List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp())), LocalDateTime.of(2026,4,1,1,1,1));


        assertThat(cancelSubmitted.getSourceKey()).isEqualTo(approved.getSourceKey());

    }

    @Test
    @DisplayName("출장취소기안이 결재완료되면, 출장일정취소 이벤트가 발행")
    void create_cancel_submitted() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        BusinessTripDraft approved = getApproved(drafter);
        String sourceKey = approved.getSourceKey();
        ApproversParam approversParam = new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp());
        BusinessTripCancelDraft cancelSubmitted = BusinessTripCancelDraft.createSubmitted(drafter, "test", "test", sourceKey, List.of(approversParam), LocalDateTime.of(2026,4,1,1,1,1));

        cancelSubmitted.approve(approversParam.approver(), LocalDateTime.of(2026,5,1,0,0,0));

        DomainEvent domainEvent = cancelSubmitted.domainEvents().getFirst();
        ScheduleCancellationEvent event = (ScheduleCancellationEvent) domainEvent;

        assertThat(event.sourceKey()).isEqualTo(sourceKey);
    }

    private BusinessTripDraft getApproved(Emp drafter) {
        Emp approver = getApprovedEmp("202601002", "test_Emp");

        String title = "test";
        String content = "test";
        LocalDateTime startAt = LocalDateTime.of(2026,4,1,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026,4,4,0,0,0);
        String destination = "test";
        String purpose ="test";
        ApproversParam approversParam = new ApproversParam(ApprovalRole.APPROVER, 1, approver);

        LocalDateTime submittedAt = LocalDateTime.of(2026,3,1,0,0,0);

        BusinessTripDraft submitted = BusinessTripDraft.createSubmitted(
                drafter, title, content, startAt, endAt, destination, purpose, List.of(drafter), List.of(approversParam), submittedAt
        );

        submitted.approve(approver, LocalDateTime.of(2026,1,1,0,0,0));

        return submitted;

    }
}