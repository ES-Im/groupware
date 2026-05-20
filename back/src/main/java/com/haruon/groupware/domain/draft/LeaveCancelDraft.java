package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.schedule.ScheduleCancellationEvent;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LeaveCancelDraft extends Draft {

    private LeaveCancelDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static LeaveCancelDraft createDraft(
            Emp emp,
            String title,
            String content,
            String sourceKey,
            List<ApproversParam> approvers
    ) {
        LeaveCancelDraft cancelDraft = new LeaveCancelDraft(title, content, emp);

        cancelDraft.init(sourceKey);
        cancelDraft.createDraftApproval(approvers);

        return cancelDraft;
    }

    public static LeaveCancelDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            String sourceKey,
            List<ApproversParam> approvers, LocalDateTime submittedAt
    ) {
        LeaveCancelDraft cancelDraft = new LeaveCancelDraft(title, content, emp);

        cancelDraft.init(sourceKey);
        cancelDraft.createSubmittedApproval(approvers, submittedAt);

        return cancelDraft;
    }

    private void init(
            String sourceKey
    ) {
        requireNonNull(sourceKey);

        this.sourceKey = sourceKey;
    }

    @Override
    public void approve(Emp approver, LocalDateTime approvedAt) {
        super.approve(approver, approvedAt);
        boolean hasAllApproved = this.hasAllApproved();

        if(hasAllApproved) {
            publishLeaveCancelledEvent();
        }
    }

    private void publishLeaveCancelledEvent() {
        registerEvent(new ScheduleCancellationEvent(this.sourceKey));
    }


}
