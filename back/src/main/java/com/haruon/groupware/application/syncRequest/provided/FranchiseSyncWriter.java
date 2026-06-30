package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;

import java.util.List;

/**
 * Batch writer에서 daily-sales command를 실제 엔티티 반영과 SyncTask 상태 전이로 처리하는 Port.
 */
public interface FranchiseSyncWriter {

    void writeDailySale(FranchiseSyncCommand<DailySalesRequest> command, int maxRetryCount);

    void writeDailySales(List<FranchiseSyncCommand<DailySalesRequest>> commands, int maxRetryCount);

    void writeInquiry(FranchiseSyncCommand<InquiryRequest> command, int maxRetryCount);

    void writeInquiries(List<FranchiseSyncCommand<InquiryRequest>> commands, int maxRetryCount);

    void writeEducationApplication(FranchiseSyncCommand<ApplicationRequest> command, int maxRetryCount);

    void writeEducationApplications(List<FranchiseSyncCommand<ApplicationRequest>> commands, int maxRetryCount);

    void writeEducationCancellation(FranchiseSyncCommand<CancellationRequest> command, int maxRetryCount);

    void writeEducationCancellations(List<FranchiseSyncCommand<CancellationRequest>> commands, int maxRetryCount);


}
