package com.haruon.groupware.domain.sync;

import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = {"franchise", "education"})
public class FranchiseSyncRequest extends SyncRequest {

    private Franchise franchise;

    @Nullable
    private Education education;

    public FranchiseSyncRequest(
            SyncType type,
            String externalId,
            String endpointPath,
            Franchise franchise,
            @Nullable Education education
    ) {
        super(type, externalId, endpointPath);

        validateEducation(type, education);

        this.franchise = requireNonNull(franchise);
        this.education = education;
    }

    private void validateEducation(SyncType type, @Nullable Education education) {
        if (type == SyncType.EDUCATION_APPLICATION
                || type == SyncType.EDUCATION_APPLICATION_CANCEL) {
            state(education != null, "교육 신청/취소 sync 요청은 education이 필요함");
        }
    }

}
