package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import org.jspecify.annotations.Nullable;

/**
 * Mock Url에서 불러온 데이터(item)을
 * ItemWriter(※각 서비스대상 엔티티 저장 & syncTask 엔티티 저장)에서 사용할 수 있도록
 * DTO(JSON을 JAVA 객체화한거) -> DTO(Commander)로 변환
 * 즉, Spring batch에서 ItemProcessor<FranchiseSyncResponse<T>, FranchiseSyncCommand<T>> 단계
 */
public interface FranchiseSyncProcessor {

    @Nullable
    FranchiseSyncCommand<DailySalesRequest> processForDailySalesData (
            String endpointPath, DailySalesSyncItem item
    );

    @Nullable
    FranchiseSyncCommand<InquiryRequest> processForInquiryData (
            String endpointPath, InquirySyncItem item
    );

    @Nullable
    FranchiseSyncCommand<ApplicationRequest> processEducationApplyData (
            String endpointPath, EducationApplicationSyncItem item
    );

    @Nullable
    FranchiseSyncCommand<CancellationRequest> processEducationCancelData (
            String endpointPath, EducationCancellationSyncItem item
    );


}
