package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.franchise.provided.forImport.EducationApplicationImporter;
import com.haruon.groupware.application.franchise.provided.forImport.FranchiseDailySalesImporter;
import com.haruon.groupware.application.franchise.provided.forImport.InquiryImporter;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncWriter;
import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FranchiseSyncWriterService implements FranchiseSyncWriter {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final SyncTaskManager syncTaskManager;

    private final FranchiseDailySalesImporter dailySalesImporter;
    private final EducationApplicationImporter educationApplicationImporter;
    private final InquiryImporter inquiryImporter;

    @Override
    public void writeDailySale(
            FranchiseSyncCommand<DailySalesRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            dailySalesImporter.importDailySales(command.franchiseId(), command.request());

            syncTaskManager.complete(command.syncTask(), now());
        } catch (Exception e) {
            syncTaskManager.fail(
                    command.syncTask(),
                    now(),
                    resolveErrorMessage(e),
                    maxRetryCount
            );
        }
    }

    @Override
    public void writeDailySales(
            List<FranchiseSyncCommand<DailySalesRequest>> commands,
            int maxRetryCount
    ) {
        commands.forEach(command -> writeDailySale(command, maxRetryCount));
    }

    @Override
    public void writeInquiry(
            FranchiseSyncCommand<InquiryRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            inquiryImporter.importInquiry(command.franchiseId(), command.request());

            syncTaskManager.complete(command.syncTask(), now());
        } catch (Exception e) {
            syncTaskManager.fail(
                    command.syncTask(),
                    now(),
                    resolveErrorMessage(e),
                    maxRetryCount
            );
        }
    }

    @Override
    public void writeInquiries(
            List<FranchiseSyncCommand<InquiryRequest>> commands,
            int maxRetryCount
    ) {
        commands.forEach(command -> writeInquiry(command, maxRetryCount));
    }

    @Override
    public void writeEducationApplication(
            FranchiseSyncCommand<ApplicationRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            educationApplicationImporter.importEducationApplication(command.request().educationId(), command.request());

            syncTaskManager.complete(command.syncTask(), now());
        } catch (Exception e) {
            syncTaskManager.fail(
                    command.syncTask(),
                    now(),
                    resolveErrorMessage(e),
                    maxRetryCount
            );
        }
    }

    @Override
    public void writeEducationApplications(
            List<FranchiseSyncCommand<ApplicationRequest>> commands,
            int maxRetryCount
    ) {
        commands.forEach(command -> writeEducationApplication(command, maxRetryCount));
    }

    @Override
    public void writeEducationCancellation(
            FranchiseSyncCommand<CancellationRequest> command,
            int maxRetryCount
    ) {
        syncTaskManager.start(command.syncTask(), now());

        try {
            educationApplicationImporter.cancelEducationApplication(command.request().educationId(), command.request());

            syncTaskManager.complete(command.syncTask(), now());
        } catch (Exception e) {
            syncTaskManager.fail(
                    command.syncTask(),
                    now(),
                    resolveErrorMessage(e),
                    maxRetryCount
            );
        }
    }

    @Override
    public void writeEducationCancellations(
            List<FranchiseSyncCommand<CancellationRequest>> commands,
            int maxRetryCount
    ) {
        commands.forEach(command -> writeEducationCancellation(command, maxRetryCount));
    }

    private LocalDateTime now() {
        return LocalDateTime.now(SEOUL_ZONE);
    }

    private String resolveErrorMessage(Exception ex) {
        if (ex instanceof ApplicationException applicationException) {
            return String.format(
                    "[APPLICATION ERROR] ErrorCode : %s, Message : %s",
                    applicationException.getErrorCode(), applicationException.getMessage());
        }

        String errorMsg = ex.getMessage() == null || ex.getMessage().isBlank()
                ? ""
                : ex.getMessage();

        if (errorMsg.isBlank()) {
            return String.format("ErrorName : %s", ex.getClass().getSimpleName());
        }

        return String.format(
                "ErrorName : %s, Message : %s",
                ex.getClass().getSimpleName(),
                errorMsg
        );
    }
}
