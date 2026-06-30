package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.franchise.EducationNotFoundException;
import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.provided.FranchiseSyncProcessor;
import com.haruon.groupware.application.syncRequest.provided.SyncTaskManager;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
@Transactional
@RequiredArgsConstructor
public class FranchiseSyncProcessorService implements FranchiseSyncProcessor {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final SyncTaskManager syncTaskManager;
    private final FranchiseRepository franchiseRepository;
    private final EducationRepository educationRepository;

    @Override
    public FranchiseSyncCommand<DailySalesRequest> processForDailySalesData(
            String endpointPath, DailySalesSyncItem item
    ) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        FranchiseSyncTask syncTask = createSyncTask(SyncType.DAILY_SALES, endpointPath, item.externalId(), item.itemIdx(), franchise);

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                new DailySalesRequest(
                        item.externalId(),
                        item.salesDate(),
                        item.salesAmount(),
                        item.orderCount()
                )
        );
    }

    @Override
    public FranchiseSyncCommand<InquiryRequest> processForInquiryData(String endpointPath, InquirySyncItem item) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        FranchiseSyncTask syncTask = createSyncTask(SyncType.INQUIRY, endpointPath, item.externalId(), item.itemIdx(), franchise);

        LocalDateTime inquiredAt = toLocalDateTime(item.inquiryAt());

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                new InquiryRequest(
                        item.externalId(),
                        item.inquirerContact(),
                        inquiredAt,
                        item.inquiryTitle(),
                        item.inquiryContent(),
                        item.type()
                )
        );
    }

    @Override
    public FranchiseSyncCommand<ApplicationRequest> processEducationApplyData(String endpointPath, EducationApplicationSyncItem item) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        Education education = getEducationByEducationCode(item.educationCode());

        FranchiseSyncTask syncTask = createSyncTask(
                SyncType.EDUCATION_APPLICATION, endpointPath, item.externalId(), item.itemIdx(), franchise, education
        );

        LocalDateTime appliedAt = toLocalDateTime(item.appliedAt());

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                new ApplicationRequest(
                        item.externalId(),
                        franchise.getId(),
                        education.getId(),
                        item.appliedCount(),
                        appliedAt
                )
        );
    }


    @Override
    public FranchiseSyncCommand<CancellationRequest> processEducationCancelData(
            String endpointPath,
            EducationCancellationSyncItem item
    ) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        Education education = getEducationByEducationCode(item.educationCode());

        FranchiseSyncTask syncTask = createSyncTask(
                SyncType.EDUCATION_APPLICATION_CANCEL, endpointPath, item.externalId(), item.itemIdx(), franchise, education
        );

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                new CancellationRequest(
                        franchise.getId(),
                        education.getId(),
                        item.externalId()
                )
        );
    }

    private void validateRequired(String endpointPath, Object item) {
        if (endpointPath == null || item == null || endpointPath.isBlank()) {
            throw new RequiredValueMissingException();
        }
    }

    private FranchiseSyncTask createSyncTask(
            SyncType type,
            String endpointPath,
            String externalId,
            Integer itemIdx,
            Franchise franchise
    ) {
        return syncTaskManager.create(
                type,
                externalId,
                itemIdx,
                buildEndpointPath(endpointPath, externalId, itemIdx),
                franchise,
                null
        );
    }

    private FranchiseSyncTask createSyncTask(
            SyncType type,
            String endpointPath,
            String externalId,
            Integer itemIdx,
            Franchise franchise,
            Education education
    ) {
        return syncTaskManager.create(
                type,
                externalId,
                itemIdx,
                buildEndpointPath(endpointPath, externalId, itemIdx),
                franchise,
                education
        );
    }



    private Franchise getFranchiseByBusinessNumber(String businessNum) {
        return franchiseRepository.findByBusinessNumber(businessNum)
                .orElseThrow(FranchiseNotFoundException::new);
    }


    private Education getEducationByEducationCode(String educationCode) {
        return educationRepository.findByEducationCode(educationCode)
                .orElseThrow(EducationNotFoundException::new);
    }


    private LocalDateTime toLocalDateTime(OffsetDateTime targetTime) {
        return targetTime.atZoneSameInstant(SEOUL_ZONE).toLocalDateTime();
    }


    private String buildEndpointPath(String endpointPath, String externalId, Integer itemIdx) {
        return String.format("%s?externalId=%s&itemIdx=%d", endpointPath, externalId, itemIdx);
    }
}
