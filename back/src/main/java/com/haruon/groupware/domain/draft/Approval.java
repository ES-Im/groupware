package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Approval extends AbstractEntity {

    private Draft draft;

    private ApprovalStatus status;

    private final List<Approver> approvers = new ArrayList<>();

    static Approval createDraft(Draft draft, @Nullable List<ApproversParam> params) {
        Approval approval = new Approval();

        approval.draft = requireNonNull(draft);
        approval.status = ApprovalStatus.UNSUBMITTED;

        if (params != null && !params.isEmpty()) {
            approval.addApprovers(params);
        }

        return approval;
    }

    void submit(@Nullable List<ApproversParam> params) {
        state(this.status == ApprovalStatus.UNSUBMITTED
                , "상신 가능한 상태가 아님");

        if (params != null && !params.isEmpty()) {
            this.addApprovers(params);
        }

        state(!this.approvers.isEmpty(), "결재자 정보가 없음");

        this.status = ApprovalStatus.WAITING;
    }

    static Approval createWaiting(
            Draft draft,
            List<ApproversParam> approverParams
    ) {
        requireNonNull(draft, "기안서는 필수");
        requireNonNull(approverParams, "결재선은 필수");

        state(!approverParams.isEmpty(), "결재선은 필수");

        Approval approval = new Approval();
        approval.draft = draft;
        approval.status = ApprovalStatus.WAITING;

        for (ApproversParam param : approverParams) {
            approval.addApprover(param);
        }

        return approval;
    }

    static Approval createSubmitted(Draft draft, List<ApproversParam> params) {
        requireNonNull(params, "결재자 정보가 없음");
        state(!params.isEmpty(), "결재자 정보가 없음");

        Approval approval = new Approval();
        approval.draft = requireNonNull(draft);
        approval.status = ApprovalStatus.UNSUBMITTED;
        approval.addApprovers(params);
        approval.status = ApprovalStatus.WAITING;

        return approval;
    }

    void revertToDraft() {
        state(this.status.equals(ApprovalStatus.WAITING), "결재진행 이후 상신 취소 불가");

        this.status = ApprovalStatus.UNSUBMITTED;
    }

    void approve(Emp approver, LocalDateTime approvedAt) {
        requireNonNull(approver, "승인자가 없음");
        requireNonNull(approvedAt, "승인시각이 없음");

        state(this.status != ApprovalStatus.REJECTED, "반려된 결재건은 승인할 수 없음");
        state(this.status != ApprovalStatus.APPROVED, "이미 완료된 결재건은 승인할 수 없음");
        state(!this.approvers.isEmpty(), "처리할 결재자가 없음");

        Approver current = getCurrentPendingMember();

        state(current.getApprover().equals(approver), "현재 차례의 결재자가 아님");

        current.approve(approvedAt);

        boolean hasRemaining = this.approvers.stream()
                .anyMatch(Approver::isPending);

        this.status = hasRemaining ? ApprovalStatus.IN_PROGRESS : ApprovalStatus.APPROVED;
    }

    void reject(Emp rejector, String reason, LocalDateTime rejectedAt) {
        requireNonNull(rejector);
        requireNonNull(reason);
        state(!reason.isBlank(), "반려사유는 빈칸이 될 수 없음");

        state(this.status != ApprovalStatus.REJECTED, "반려된 결재건은 승인할 수 없음");
        state(this.status != ApprovalStatus.APPROVED, "이미 완료된 결재건은 승인할 수 없음");
        state(!this.approvers.isEmpty(), "처리할 결재자가 없음");

        Approver current = getCurrentPendingMember();
        state(current.getApprover().equals(rejector), "현재 차례의 결재자가 아님");

        current.reject(reason, rejectedAt);
        this.status = ApprovalStatus.REJECTED;
    }

    boolean isApproved() {
        return this.status.equals(ApprovalStatus.APPROVED);
    }

    boolean isDraft() {
        return this.status == ApprovalStatus.UNSUBMITTED;
    }

    private void addApprover(ApproversParam param) {
        state(param.order() > 0, "순서는 양수여야함");
        requireNonNull(param.role());
        requireNonNull(param.approver());

        boolean exists = approvers.stream()
                .anyMatch(member -> member.getApprover().equals(param.approver()));
        boolean occupiedOrder = approvers.stream()
                .anyMatch(m -> m.getOrder() == param.order());

        state(!exists, "이미 추가된 결재자정보");
        state(!occupiedOrder, "이미 선점된 결재 순서");

        Approver approvers = new Approver(this, param.role(), param.order(), param.approver());

        this.approvers.add(approvers);
    }

    private void addApprovers(List<ApproversParam> params) {
        for (ApproversParam param : params) {
            this.addApprover(param);
        }
    }

    private Approver getCurrentPendingMember() {
        return this.approvers.stream()
                .filter(Approver::isPending)
                .min(Comparator.comparingInt(Approver::getOrder))
                .orElseThrow(() -> new IllegalStateException("처리할 결재자가 없음"));
    }

}
