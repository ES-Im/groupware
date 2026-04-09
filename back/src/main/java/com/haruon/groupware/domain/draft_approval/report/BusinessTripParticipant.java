package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"business_trip_draft_id", "emp_id"})
)
public class BusinessTripParticipant extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_trip_draft_id", nullable = false)
    private BusinessTripDraft businessTripDraft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emp_id", nullable = false)
    private Emp emp;

    private BusinessTripParticipant(BusinessTripDraft businessTripDraft, Emp emp) {
        this.businessTripDraft = requireNonNull(businessTripDraft);
        this.emp = requireNonNull(emp);
    }

    protected static BusinessTripParticipant create(BusinessTripDraft businessTripDraft, Emp emp) {
        return new BusinessTripParticipant(businessTripDraft, emp);
    }


}
