package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncWriter;
import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class FranchiseSyncWriterService implements FranchiseSyncWriter {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final SyncTaskManager syncTaskManager;
    private final FranchiseSyncImportExecutor importExecutor;

    @Override
    public boolean writeDailySale(FranchiseSyncCommand<DailySalesRequest> command, int maxRetryCount) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            importExecutor.importDailySales(command.franchiseId(), command.request());
        } catch (Exception e) {
            fail(command.syncTask(), e, maxRetryCount);
            return false;
        }

        syncTaskManager.complete(command.syncTask(), now());
        return true;
    }

    @Override
    public boolean writeInquiry(FranchiseSyncCommand<InquiryRequest> command, int maxRetryCount) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            importExecutor.importInquiry(command.franchiseId(), command.request());
        } catch (Exception e) {
            fail(command.syncTask(), e, maxRetryCount);
            return false;
        }

        syncTaskManager.complete(command.syncTask(), now());
        return true;
    }

    @Override
    public boolean writeEducationApplication(
            FranchiseSyncCommand<ApplicationRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            importExecutor.importEducationApplication(command.request());
        } catch (Exception e) {
            fail(command.syncTask(), e, maxRetryCount);
            return false;
        }

        syncTaskManager.complete(command.syncTask(), now());
        return true;
    }

    @Override
    public boolean writeEducationCancellation(
            FranchiseSyncCommand<CancellationRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            importExecutor.importEducationCancellation(command.request());
        } catch (Exception e) {
            fail(command.syncTask(), e, maxRetryCount);
            return false;
        }

        syncTaskManager.complete(command.syncTask(), now());
        return true;
    }

    private void fail(FranchiseSyncTask syncTask, Exception exception, int maxRetryCount) {
        syncTaskManager.fail(syncTask, now(), resolveErrorMessage(exception), maxRetryCount);
    }

    private LocalDateTime now() {
        return LocalDateTime.now(SEOUL_ZONE);
    }

    private String resolveErrorMessage(Exception exception) {
        if (exception instanceof ApplicationException applicationException) {
            return String.format(
                    "[APPLICATION ERROR] ErrorCode : %s, Message : %s",
                    applicationException.getErrorCode(),
                    applicationException.getMessage()
            );
        }

        String errorMessage = exception.getMessage();
        if (errorMessage == null || errorMessage.isBlank()) {
            return String.format("ErrorName : %s", exception.getClass().getSimpleName());
        }

        return String.format(
                "ErrorName : %s, Message : %s",
                exception.getClass().getSimpleName(),
                errorMessage
        );
    }
}
