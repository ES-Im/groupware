package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"approval_id", "emp_id"})
)
public class ApprovalMember extends AbstractEntity {   // 협조

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_id", nullable = false)
    private Approval approval;

    @Enumerated(EnumType.STRING)
    private ApprovalRole role;

    private int order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emp_id", nullable = false)
    private Emp emp;

    private LocalDateTime approvedAt;

    private String rejectReason;

    private LocalDateTime rejectedAt;

    private boolean isProcessed;

    // 경우의 수
    /*
     * - 중간결재 + 협조 + 최종결재
     * - 중간결재 + 최종결재
     * - 협조 + 최종결재
     * - 최종결재
     *
     * - 방법 1, 각 롤에 따른 결재자 추가
     * - role을 중간결재 + 최종결재 쪼개기
     *
     * - 방법 2, 연관관계상 oneTomany임 -> 사이즈 별로 order에 따른 결재 순서
     * 이러면 role을 쪼갤 필욘 없음. order는 최소 1, 최대 3 = members 사이즈와 동일
     * 근데 role을 쪼개는게........... 맞나........... 중간결재와 최종결재의 순서가 중요.
     *
     * [결론]
     * 우선 여기에 롤, order, emp 생성 팩토리 만들고
     * + 거절사유 및 시각 팩토리 만들기
     * + order는 프로덕션코드로 커버 가능
     *
     * 모든 접근 제어는 default로 access
     */

    ApprovalMember(
            Approval approval,
            ApprovalRole role,
            int order,
            Emp emp
    ) {
        this.approval = requireNonNull(approval);
        this.role = requireNonNull(role);
        this.order = order;
        this.emp = requireNonNull(emp);
    }

    void approve(LocalDateTime approvedAt) {
        this.approvedAt = requireNonNull(approvedAt);
    }

}
