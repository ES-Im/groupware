package com.haruon.groupware.application.syncRequest.required;

import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.validation.annotation.Validated;

/**
 * Franchise 외부 데이터를 요청하기 위한 restApi request Collector
 */
@Validated
public interface ExternalFranchiseDataCollector {

    @NotNull @Valid
    FranchiseSyncResponse<DailySalesSyncItem> collectDailySales();

    @NotNull @Valid
    FranchiseSyncResponse<DailySalesSyncItem> collectDailySales(
            @NotBlank String externalId,
            @NotNull @PositiveOrZero Integer itemIdx
    );

    @NotNull @Valid
    FranchiseSyncResponse<InquirySyncItem> collectInquiries();

    @NotNull @Valid
    FranchiseSyncResponse<InquirySyncItem> collectInquiries(
            @NotBlank String externalId,
            @NotNull @PositiveOrZero Integer itemIdx
    );

    @NotNull @Valid
    FranchiseSyncResponse<EducationApplicationSyncItem> collectEducationApplications();

    @NotNull @Valid
    FranchiseSyncResponse<EducationApplicationSyncItem> collectEducationApplications(
            @NotBlank String externalId,
            @NotNull @PositiveOrZero Integer itemIdx
    );

    @NotNull @Valid
    FranchiseSyncResponse<EducationCancellationSyncItem> collectEducationApplicationCancellations();

    @NotNull @Valid
    FranchiseSyncResponse<EducationCancellationSyncItem> collectEducationApplicationCancellations(
            @NotBlank String externalId,
            @NotNull @PositiveOrZero Integer itemIdx
    );

}
