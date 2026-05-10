package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class BusinessTripParticipant extends AbstractEntity {

    private BusinessTripDraft businessTripDraft;

    private Emp emp;

    private BusinessTripParticipant(BusinessTripDraft businessTripDraft, Emp emp) {
        this.businessTripDraft = requireNonNull(businessTripDraft);
        this.emp = requireNonNull(emp);
    }

    protected static BusinessTripParticipant create(BusinessTripDraft businessTripDraft, Emp emp) {
        return new BusinessTripParticipant(businessTripDraft, emp);
    }


}
