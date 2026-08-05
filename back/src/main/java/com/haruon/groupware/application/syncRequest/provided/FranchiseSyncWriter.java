package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;

/**
 * Batch writer에서 daily-sales command를 실제 엔티티 반영과 SyncTask 상태 전이로 처리하는 Port.
 */
public interface FranchiseSyncWriter {

    boolean writeDailySale(FranchiseSyncCommand<DailySalesRequest> command, int maxRetryCount);

    boolean writeInquiry(FranchiseSyncCommand<InquiryRequest> command, int maxRetryCount);

    boolean writeEducationApplication(FranchiseSyncCommand<ApplicationRequest> command, int maxRetryCount);

    boolean writeEducationCancellation(FranchiseSyncCommand<CancellationRequest> command, int maxRetryCount);


}
