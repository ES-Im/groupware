package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Approval extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="draft_id", nullable = false)
    private Draft draft;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status;

    @OneToMany(mappedBy = "approval", orphanRemoval = true, cascade = CascadeType.ALL)
    private final List<ApprovalMember> members = new ArrayList<>();

    Approval(Draft draft) {
        this.draft = requireNonNull(draft);

        this.status = ApprovalStatus.WAITING;
    }


    // 순서 -> 중간결재자 넣기 -> 협조자 넣기 -> 최종결재자 넣기
    // 넣을때 validation 해서 order 조작 cnt++로 적용하면 될듯

    void addApprover(Approval approval, ApprovalRole role, int order, Emp approver) {
        boolean exists = members.stream()
                .anyMatch(member -> member.getEmp().equals(approver));
        boolean occupiedOrder = members.stream()
                        .anyMatch(m -> m.getOrder() == order);

        state(!exists, "이미 추가된 결재자정보");
        state(!occupiedOrder, "이미 선점된 결재 순서");

        ApprovalMember approvalMember = new ApprovalMember(approval, role, order, approver);

        members.add(approvalMember);
    }

    public void approve(Emp approver, LocalDateTime approvedAt) {
        requireNonNull(approver, "승인자가 없음");
        requireNonNull(approvedAt, "승인시각이 없음");

        state(this.status != ApprovalStatus.REJECTED, "반려된 결재건은 승인할 수 없음");
        state(this.status != ApprovalStatus.APPROVED, "이미 완료된 결재건은 승인할 수 없음");

        ApprovalMember current = getCurrentPendingMember();

        state(current.getEmp().equals(approver), "현재 차례의 결재자가 아님");

        current.approve(approvedAt);

        boolean hasRemaining = this.members.stream()
                .anyMatch(member -> !member.isProcessed());

        this.status = hasRemaining ? ApprovalStatus.IN_PROGRESS : ApprovalStatus.APPROVED;
    }

    private ApprovalMember getCurrentPendingMember() {
        return this.members.stream()
                .filter(member -> !member.isProcessed())
                .min(Comparator.comparingInt(ApprovalMember::getOrder))
                .orElseThrow(() -> new IllegalStateException("처리할 결재자가 없음"));
    }

    void changeApprovalStatus(ApprovalStatus approvalStatus) {
        this.status = requireNonNull(approvalStatus);
    }


    boolean isProcessed() {
        return this.status.equals(ApprovalStatus.IN_PROGRESS);
    }

    // 최종 결재자승인
    // 반려 로직

}
