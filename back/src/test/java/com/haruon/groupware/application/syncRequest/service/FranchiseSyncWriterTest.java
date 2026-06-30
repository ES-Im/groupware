package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.franchise.provided.forImport.EducationApplicationImporter;
import com.haruon.groupware.application.franchise.provided.forImport.FranchiseDailySalesImporter;
import com.haruon.groupware.application.franchise.provided.forImport.InquiryImporter;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InOrder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FranchiseSyncWriterTest {

    private static final int MAX_RETRY_COUNT = 3;

    private final SyncTaskManager syncTaskManager = mock(SyncTaskManager.class);
    private final FranchiseDailySalesImporter dailySalesImporter = mock(FranchiseDailySalesImporter.class);
    private final EducationApplicationImporter educationApplicationImporter = mock(EducationApplicationImporter.class);
    private final InquiryImporter inquiryImporter = mock(InquiryImporter.class);

    private final FranchiseSyncWriterService writer = new FranchiseSyncWriterService(
            syncTaskManager,
            dailySalesImporter,
            educationApplicationImporter,
            inquiryImporter
    );

    @Test
    @DisplayName("DailySales import에 성공하면 SyncTask를 start 후 complete 한다")
    void writeDailySale_success() {
        FranchiseSyncCommand<DailySalesRequest> command = command();

        writer.writeDailySale(command, MAX_RETRY_COUNT);

        InOrder inOrder = inOrder(syncTaskManager, dailySalesImporter);
        inOrder.verify(syncTaskManager).start(eq(command.syncTask()), any(LocalDateTime.class));
        inOrder.verify(dailySalesImporter).importDailySales(command.franchiseId(), command.request());
        inOrder.verify(syncTaskManager).complete(eq(command.syncTask()), any(LocalDateTime.class));
        verify(syncTaskManager, never()).fail(any(), any(), anyString(), anyInt());
        verifyNoInteractions(educationApplicationImporter, inquiryImporter);
    }

    @ParameterizedTest(name = "{index} ==> expected={1}")
    @MethodSource("importFailures")
    @DisplayName("DailySales import에 실패하면 SyncTask를 fail 처리한다")
    void writeDailySale_fail(Exception exception, String expectedErrorMessage) {
        FranchiseSyncCommand<DailySalesRequest> command = command();
        doThrow(exception)
                .when(dailySalesImporter)
                .importDailySales(command.franchiseId(), command.request());

        writer.writeDailySale(command, MAX_RETRY_COUNT);

        InOrder inOrder = inOrder(syncTaskManager, dailySalesImporter);
        inOrder.verify(syncTaskManager).start(eq(command.syncTask()), any(LocalDateTime.class));
        inOrder.verify(dailySalesImporter).importDailySales(command.franchiseId(), command.request());
        inOrder.verify(syncTaskManager).fail(
                eq(command.syncTask()),
                any(LocalDateTime.class),
                eq(expectedErrorMessage),
                eq(MAX_RETRY_COUNT)
        );
        verify(syncTaskManager, never()).complete(any(), any());
        verifyNoInteractions(educationApplicationImporter, inquiryImporter);
    }

    private static Stream<Arguments> importFailures() {
        return Stream.of(
                Arguments.of(
                        new IllegalStateException("import failed"),
                        "ErrorName : IllegalStateException, Message : import failed"
                ),
                Arguments.of(
                        new IllegalStateException(" "),
                        "ErrorName : IllegalStateException"
                ),
                Arguments.of(
                        new IllegalStateException(),
                        "ErrorName : IllegalStateException"
                ),
                Arguments.of(
                        new RequiredValueMissingException(),
                        "[APPLICATION ERROR] ErrorCode : REQUIRED_VALUE_MISSING_EXCEPTION, Message : 필수 값이 누락되었습니다."
                )
        );
    }

    private FranchiseSyncCommand<DailySalesRequest> command() {
        Franchise franchise = mock(Franchise.class);
        DailySalesRequest request = new DailySalesRequest(
                "SALES-1108167890-20250101",
                LocalDate.of(2025, 1, 1),
                1000000L,
                100L
        );
        FranchiseSyncTask syncTask = new FranchiseSyncTask(
                SyncType.DAILY_SALES,
                request.externalId(),
                0,
                "/api/daily-sales?externalId=SALES-1108167890-20250101&itemIdx=0",
                franchise,
                null
        );

        return new FranchiseSyncCommand<>(syncTask, 1L, request);
    }
}
