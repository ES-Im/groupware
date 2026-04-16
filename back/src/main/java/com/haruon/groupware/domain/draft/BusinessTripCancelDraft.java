package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.byBusinessTripApprove.BusinessTripCancelledEvent;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import static java.util.Objects.requireNonNull;

@Getter
@DiscriminatorValue("BUSINESS_TRIP_CANCEL")
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessTripCancelDraft extends Draft {

    @Column(updatable = false, nullable = false)
    private String sourceKey;

    private BusinessTripCancelDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static BusinessTripCancelDraft createDraft(
            Emp emp,
            String title,
            String content,
            String sourceKey,
            List<ApproversParam> approvers
    ) {
        BusinessTripCancelDraft cancelDraft = new BusinessTripCancelDraft(title, content, emp);
        cancelDraft.init(sourceKey);
        cancelDraft.createDraftApproval(approvers);

        return cancelDraft;
    }

    public static BusinessTripCancelDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            String sourceKey,
            List<ApproversParam> approvers, LocalDateTime submittedAt
    ) {
        BusinessTripCancelDraft cancelDraft = new BusinessTripCancelDraft(title, content, emp);

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
            publishBusinessTripCancelledEvent();
        }
    }

    private void publishBusinessTripCancelledEvent() {
        registerEvent(
                BusinessTripCancelledEvent.builder().sourceKey(this.sourceKey).build()
        );
    }


}
