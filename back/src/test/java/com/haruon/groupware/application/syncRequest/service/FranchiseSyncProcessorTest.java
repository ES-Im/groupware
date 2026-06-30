package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.InquiryType;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

class FranchiseSyncProcessorTest {

    private final SyncTaskManager syncTaskManager = mock(SyncTaskManager.class);
    private final FranchiseRepository franchiseRepository = mock(FranchiseRepository.class);
    private final EducationRepository educationRepository = mock(EducationRepository.class);

    private final FranchiseSyncProcessorService processor = new FranchiseSyncProcessorService(
            syncTaskManager,
            franchiseRepository,
            educationRepository
    );

    @ParameterizedTest(name = "{index} ==> itemIdx={0}")
    @CsvSource({
            "0, SALES-1108167890-20250101, /api/daily-sales?externalId=SALES-1108167890-20250101&itemIdx=0",
            "36, SALES-1108167890-20250206, /api/daily-sales?externalId=SALES-1108167890-20250206&itemIdx=36"
    })
    @DisplayName("DailySalesSyncItem을 SyncTask와 DailySalesRequest를 포함한 command로 변환한다")
    void processForDailySalesData_success(int itemIdx, String externalId, String expectedEndpointPath) {
        String businessNumber = "1108167890";
        DailySalesSyncItem item = dailySalesItem(itemIdx, externalId, businessNumber);
        Franchise franchise = franchise(1L);
        FranchiseSyncTask syncTask = new FranchiseSyncTask(
                SyncType.DAILY_SALES,
                externalId,
                itemIdx,
                expectedEndpointPath,
                franchise,
                null
        );

        when(franchiseRepository.findByBusinessNumber(businessNumber)).thenReturn(Optional.of(franchise));
        when(syncTaskManager.create(
                eq(SyncType.DAILY_SALES),
                eq(externalId),
                eq(itemIdx),
                eq(expectedEndpointPath),
                eq(franchise),
                isNull()
        )).thenReturn(syncTask);

        FranchiseSyncCommand<DailySalesRequest> command = processor.processForDailySalesData("/api/daily-sales", item);

        assertThat(command.syncTask()).isSameAs(syncTask);
        assertThat(command.franchiseId()).isEqualTo(1L);
        assertThat(command.request()).extracting(
                DailySalesRequest::externalId,
                DailySalesRequest::salesDate,
                DailySalesRequest::salesAmount,
                DailySalesRequest::orderCount
        ).containsExactly(
                externalId,
                item.salesDate(),
                item.salesAmount(),
                item.orderCount()
        );

        ArgumentCaptor<String> endpointPathCaptor = ArgumentCaptor.forClass(String.class);
        verify(syncTaskManager).create(
                eq(SyncType.DAILY_SALES),
                eq(externalId),
                eq(itemIdx),
                endpointPathCaptor.capture(),
                eq(franchise),
                isNull()
        );
        assertThat(endpointPathCaptor.getValue()).isEqualTo(expectedEndpointPath);
    }

    @Test
    @DisplayName("InquirySyncItem을 SyncTask와 InquiryRequest를 포함한 command로 변환한다")
    void processForInquiryData_success() {
        String businessNumber = "1108167890";
        String externalId = "INQUIRY-1108167890-20250101";
        InquirySyncItem item = inquiryItem(0, externalId, businessNumber);
        Franchise franchise = franchise(1L);
        String expectedEndpointPath = "/api/inquiries?externalId=INQUIRY-1108167890-20250101&itemIdx=0";
        FranchiseSyncTask syncTask = new FranchiseSyncTask(
                SyncType.INQUIRY,
                externalId,
                item.itemIdx(),
                expectedEndpointPath,
                franchise,
                null
        );

        when(franchiseRepository.findByBusinessNumber(businessNumber)).thenReturn(Optional.of(franchise));
        when(syncTaskManager.create(
                eq(SyncType.INQUIRY),
                eq(externalId),
                eq(item.itemIdx()),
                eq(expectedEndpointPath),
                eq(franchise),
                isNull()
        )).thenReturn(syncTask);

        FranchiseSyncCommand<InquiryRequest> command = processor.processForInquiryData("/api/inquiries", item);

        assertThat(command.syncTask()).isSameAs(syncTask);
        assertThat(command.franchiseId()).isEqualTo(1L);
        assertThat(command.request()).extracting(
                InquiryRequest::externalId,
                InquiryRequest::inquirerContact,
                InquiryRequest::inquiryAt,
                InquiryRequest::inquiryTitle,
                InquiryRequest::inquiryContent
        ).containsExactly(
                externalId,
                item.inquirerContact(),
                LocalDateTime.of(2025, 1, 1, 9, 0),
                item.inquiryTitle(),
                item.inquiryContent()
        );
    }

    @Test
    @DisplayName("EducationApplicationSyncItem을 SyncTask와 ApplicationRequest를 포함한 command로 변환한다")
    void processEducationApplyData_success() {
        String businessNumber = "1108167890";
        String educationCode = "EDU-202501-0001";
        String externalId = "EDU-APP-1108167890-20250101";
        EducationApplicationSyncItem item = educationApplicationItem(0, externalId, businessNumber, educationCode);
        Franchise franchise = franchise(1L);
        Education education = mock(Education.class);
        String expectedEndpointPath = "/api/education-applications?externalId=EDU-APP-1108167890-20250101&itemIdx=0";
        FranchiseSyncTask syncTask = new FranchiseSyncTask(
                SyncType.EDUCATION_APPLICATION,
                externalId,
                item.itemIdx(),
                expectedEndpointPath,
                franchise,
                education
        );

        when(franchiseRepository.findByBusinessNumber(businessNumber)).thenReturn(Optional.of(franchise));
        when(educationRepository.findByEducationCode(educationCode)).thenReturn(Optional.of(education));
        when(syncTaskManager.create(
                eq(SyncType.EDUCATION_APPLICATION),
                eq(externalId),
                eq(item.itemIdx()),
                eq(expectedEndpointPath),
                eq(franchise),
                eq(education)
        )).thenReturn(syncTask);

        FranchiseSyncCommand<ApplicationRequest> command = processor.processEducationApplyData(
                "/api/education-applications",
                item
        );

        assertThat(command.syncTask()).isSameAs(syncTask);
        assertThat(command.franchiseId()).isEqualTo(1L);
        assertThat(command.request()).extracting(
                ApplicationRequest::externalId,
                ApplicationRequest::franchiseId,
                ApplicationRequest::appliedCount,
                ApplicationRequest::appliedAt
        ).containsExactly(
                externalId,
                1L,
                item.appliedCount(),
                LocalDateTime.of(2025, 1, 1, 9, 0)
        );
    }

    @Test
    @DisplayName("EducationCancellationSyncItem을 SyncTask와 CancellationRequest를 포함한 command로 변환한다")
    void processEducationCancelData_success() {
        String businessNumber = "1108167890";
        String educationCode = "EDU-202501-0001";
        String externalId = "EDU-CANCEL-1108167890-20250101";
        EducationCancellationSyncItem item = educationCancellationItem(0, externalId, businessNumber, educationCode);
        Franchise franchise = franchise(1L);
        Education education = mock(Education.class);
        String expectedEndpointPath = "/api/education-application-cancellations?externalId=EDU-CANCEL-1108167890-20250101&itemIdx=0";
        FranchiseSyncTask syncTask = new FranchiseSyncTask(
                SyncType.EDUCATION_APPLICATION_CANCEL,
                externalId,
                item.itemIdx(),
                expectedEndpointPath,
                franchise,
                education
        );

        when(franchiseRepository.findByBusinessNumber(businessNumber)).thenReturn(Optional.of(franchise));
        when(educationRepository.findByEducationCode(educationCode)).thenReturn(Optional.of(education));
        when(syncTaskManager.create(
                eq(SyncType.EDUCATION_APPLICATION_CANCEL),
                eq(externalId),
                eq(item.itemIdx()),
                eq(expectedEndpointPath),
                eq(franchise),
                eq(education)
        )).thenReturn(syncTask);

        FranchiseSyncCommand<CancellationRequest> command = processor.processEducationCancelData(
                "/api/education-application-cancellations",
                item
        );

        assertThat(command.syncTask()).isSameAs(syncTask);
        assertThat(command.franchiseId()).isEqualTo(1L);
        assertThat(command.request()).extracting(
                CancellationRequest::franchiseId,
                CancellationRequest::externalId
        ).containsExactly(
                1L,
                externalId
        );
    }

    @Test
    @DisplayName("businessNumber에 해당하는 가맹점이 없으면 command 생성에 실패한다")
    void processForDailySalesData_fail_whenFranchiseNotFound() {
        DailySalesSyncItem item = dailySalesItem(0, "SALES-1108167890-20250101", "1108167890");

        when(franchiseRepository.findByBusinessNumber(item.businessNumber())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> processor.processForDailySalesData("/api/daily-sales", item))
                .isInstanceOf(FranchiseNotFoundException.class);

        verifyNoInteractions(syncTaskManager, educationRepository);
    }

    @Test
    @DisplayName("필수 입력값이 없으면 command 생성에 실패한다")
    void processForDailySalesData_fail_whenRequiredValueMissing() {
        DailySalesSyncItem item = dailySalesItem(0, "SALES-1108167890-20250101", "1108167890");

        assertThatThrownBy(() -> processor.processForDailySalesData(" ", item))
                .isInstanceOf(RequiredValueMissingException.class);

        verifyNoInteractions(syncTaskManager, franchiseRepository, educationRepository);
    }

    private Franchise franchise(long id) {
        Franchise franchise = mock(Franchise.class);
        when(franchise.getId()).thenReturn(id);
        return franchise;
    }

    private DailySalesSyncItem dailySalesItem(int itemIdx, String externalId, String businessNumber) {
        return new DailySalesSyncItem(
                itemIdx,
                externalId,
                businessNumber,
                "하루온 강남점",
                LocalDate.of(2025, 1, 1),
                1000000L,
                100L
        );
    }

    private InquirySyncItem inquiryItem(int itemIdx, String externalId, String businessNumber) {
        return new InquirySyncItem(
                itemIdx,
                externalId,
                businessNumber,
                "하루온 강남점",
                OffsetDateTime.of(2025, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC),
                "01012345678",
                "가맹 문의",
                "상담을 요청합니다.",
                InquiryType.NEW
        );
    }

    private EducationApplicationSyncItem educationApplicationItem(
            int itemIdx,
            String externalId,
            String businessNumber,
            String educationCode
    ) {
        return new EducationApplicationSyncItem(
                itemIdx,
                externalId,
                businessNumber,
                "하루온 강남점",
                educationCode,
                2L,
                OffsetDateTime.of(2025, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)
        );
    }

    private EducationCancellationSyncItem educationCancellationItem(
            int itemIdx,
            String externalId,
            String businessNumber,
            String educationCode
    ) {
        return new EducationCancellationSyncItem(
                itemIdx,
                externalId,
                businessNumber,
                "하루온 강남점",
                educationCode,
                OffsetDateTime.of(2025, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)
        );
    }
}
