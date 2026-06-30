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
public class FranchiseSyncTask extends SyncTask {

    private int itemIdx;

    private Franchise franchise;

    @Nullable
    private Education education;

    public FranchiseSyncTask(
            SyncType type,
            String externalId,
            int itemIdx,
            String endpointPath,
            Franchise franchise,
            @Nullable Education education
    ) {
        super(type, externalId, endpointPath);

        validateEducation(type, education);

        state(itemIdx >= 0, "itemIdx는 0 이상이어야 함");

        this.itemIdx = itemIdx;
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
