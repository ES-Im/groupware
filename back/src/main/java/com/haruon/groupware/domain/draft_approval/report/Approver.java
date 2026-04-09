package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"approval_id", "approver_id"})
)
public class Approver extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_id", nullable = false)
    private Approval approval;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalRole role;

    @Column(nullable = false)
    private int order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private Emp emp;

    private LocalDateTime approvedAt;

    private String rejectReason;

    private LocalDateTime rejectedAt;

    Approver(
            Approval approval,
            ApprovalRole role,
            int order,
            Emp emp
    ) {
        state(order > 0, "순서는 양수여야함");

        this.approval = requireNonNull(approval);
        this.role = requireNonNull(role);
        this.order = order;
        this.emp = requireNonNull(emp);
    }

    void approve(LocalDateTime approvedAt) {
        state(isPending(), "처리된 결재자건");

        this.approvedAt = requireNonNull(approvedAt);
    }

    void reject(String rejectReason, LocalDateTime rejectedAt) {
        state(isPending(), "처리된 결재자건");

        requireNonNull(rejectReason);
        state(!rejectReason.isBlank(), "반려사유는 필수 값");
        requireNonNull(rejectedAt);

        this.rejectedAt = rejectedAt;
        this.rejectReason = rejectReason;
    }

    boolean isPending() {
        return this.approvedAt == null && this.rejectedAt == null;
    }

}
