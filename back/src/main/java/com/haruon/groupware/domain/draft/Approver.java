package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Approver extends AbstractEntity {

    private Approval approval;

    private ApprovalRole role;

    private int order;

    private Emp approver;

    @Nullable private LocalDateTime approvedAt;

    @Nullable private String rejectReason;

    @Nullable private LocalDateTime rejectedAt;


    Approver(
            Approval approval,
            ApprovalRole role,
            int order,
            Emp approver
    ) {
        state(order > 0, "순서는 양수여야함");

        this.approval = requireNonNull(approval);
        this.role = requireNonNull(role);
        this.order = order;
        this.approver = requireNonNull(approver);
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
        return (this.approvedAt == null && this.rejectedAt == null);
    }

}
