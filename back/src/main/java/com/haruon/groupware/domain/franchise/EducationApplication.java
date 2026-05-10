package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class EducationApplication extends AbstractEntity {

    private String externalId;

    private Education education;

    private Franchise franchise;

    private long appliedCount;

    private LocalDateTime appliedAt;


    static EducationApplication create(
            String externalId, Education education, Franchise franchise, Long appliedCount, LocalDateTime appliedAt
    ) {
        requireNonNull(education);
        requireNonNull(appliedCount);
        state(!franchise.getBusinessStatus().equals(BusinessStatus.CLOSED), "폐업 상태에서는 신청 불가");

        EducationApplication educationApplication = new EducationApplication();

        educationApplication.externalId = requireNonNull(externalId);
        educationApplication.education = education;
        educationApplication.franchise = requireNonNull(franchise);
        educationApplication.appliedCount = appliedCount;
        educationApplication.appliedAt = requireNonNull(appliedAt);

        return educationApplication;
    }

    void replace(
            Long appliedCount,
            LocalDateTime appliedAt
    ) {
        this.appliedCount = requireNonNull(appliedCount);
        this.appliedAt = requireNonNull(appliedAt);
    }





}