package com.haruon.groupware.adapter.mockapi;

import com.haruon.groupware.application.syncRequest.required.ExternalFranchiseDataCollector;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.client.RestClient;

@Validated
@Component
@RequiredArgsConstructor
public class ExternalFranchiseDataCollectorAdapter implements ExternalFranchiseDataCollector {

    private final RestClient franchiseRestClient;

    private final String DAILY_SALES_PATH = "/api/daily-sales";
    private final String INQUIRY_PATH = "/api/inquiries";
    private final String EDUCATION_APPLICATION_PATH = "/api/education-applications";
    private final String EDUCATION_CANCELLATION_PATH = "/api/education-application-cancellations";
    private final String externalIdParam = "externalId";
    private final String itemIdxParam = "itemIdx";


    @Override
    public FranchiseSyncResponse<DailySalesSyncItem> collectDailySales() {
        return franchiseRestClient.get()
                .uri(DAILY_SALES_PATH)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<DailySalesSyncItem>>() {
                        }
                );
    }

    @Override
    public FranchiseSyncResponse<DailySalesSyncItem> collectDailySales(String externalId, Integer itemIdx) {
        return franchiseRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(DAILY_SALES_PATH)
                        .queryParam(externalIdParam, externalId)
                        .queryParam(itemIdxParam, itemIdx)
                        .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<DailySalesSyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<InquirySyncItem> collectInquiries() {
        return franchiseRestClient.get()
                .uri(INQUIRY_PATH)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<InquirySyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<InquirySyncItem> collectInquiries(String externalId, Integer itemIdx) {
        return franchiseRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(INQUIRY_PATH)
                        .queryParam(externalIdParam, externalId)
                        .queryParam(itemIdxParam, itemIdx)
                        .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<InquirySyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<EducationApplicationSyncItem> collectEducationApplications() {
        return franchiseRestClient.get()
                .uri(EDUCATION_APPLICATION_PATH)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<EducationApplicationSyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<EducationApplicationSyncItem> collectEducationApplications(String externalId, Integer itemIdx) {
        return franchiseRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(EDUCATION_APPLICATION_PATH)
                        .queryParam(externalIdParam, externalId)
                        .queryParam(itemIdxParam, itemIdx)
                        .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<EducationApplicationSyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<EducationCancellationSyncItem> collectEducationApplicationCancellations() {
        return franchiseRestClient.get()
                .uri(EDUCATION_CANCELLATION_PATH)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<EducationCancellationSyncItem>>() {}
                );
    }

    @Override
    public FranchiseSyncResponse<EducationCancellationSyncItem> collectEducationApplicationCancellations(String externalId, Integer itemIdx) {
        return franchiseRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(EDUCATION_CANCELLATION_PATH)
                        .queryParam(externalIdParam, externalId)
                        .queryParam(itemIdxParam, itemIdx)
                        .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<FranchiseSyncResponse<EducationCancellationSyncItem>>() {}
                );
    }



}
