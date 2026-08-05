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
import com.haruon.groupware.domain.sync.SyncStatus;
import com.haruon.groupware.domain.sync.SyncType;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class FranchiseSyncProcessorService implements FranchiseSyncProcessor {

    private final SyncTaskManager syncTaskManager;
    private final FranchiseRepository franchiseRepository;
    private final EducationRepository educationRepository;

    @Override
    @Nullable
    public FranchiseSyncCommand<DailySalesRequest> processForDailySalesData(
            String endpointPath, DailySalesSyncItem item
    ) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());

        DailySalesRequest dailySalesRequest = item.toRequest();

        FranchiseSyncTask syncTask = prepareSyncTask(
                SyncType.DAILY_SALES, endpointPath, item.externalId(), item.itemIdx(), franchise
        );
        if (syncTask == null) {
            return null;
        }

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                dailySalesRequest
        );
    }

    @Override
    @Nullable
    public FranchiseSyncCommand<InquiryRequest> processForInquiryData(String endpointPath, InquirySyncItem item) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        InquiryRequest inquiryRequest = item.toRequest();

        FranchiseSyncTask syncTask = prepareSyncTask(
                SyncType.INQUIRY, endpointPath, item.externalId(), item.itemIdx(), franchise
        );
        if (syncTask == null) {
            return null;
        }

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                inquiryRequest
        );
    }

    @Override
    @Nullable
    public FranchiseSyncCommand<ApplicationRequest> processEducationApplyData(String endpointPath, EducationApplicationSyncItem item) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        Education education = getEducationByEducationCode(item.educationCode());
        ApplicationRequest applicationRequest = item.toRequest(franchise.getId(), education.getId());

        FranchiseSyncTask syncTask = prepareSyncTask(
                SyncType.EDUCATION_APPLICATION, endpointPath, item.externalId(), item.itemIdx(), franchise, education
        );
        if (syncTask == null) {
            return null;
        }


        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                applicationRequest
        );
    }


    @Override
    @Nullable
    public FranchiseSyncCommand<CancellationRequest> processEducationCancelData(
            String endpointPath,
            EducationCancellationSyncItem item
    ) {
        validateRequired(endpointPath, item);

        Franchise franchise = getFranchiseByBusinessNumber(item.businessNumber());
        Education education = getEducationByEducationCode(item.educationCode());

        CancellationRequest cancellationRequest = item.toRequest(franchise.getId(), education.getId());

        FranchiseSyncTask syncTask = prepareSyncTask(
                SyncType.EDUCATION_APPLICATION_CANCEL, endpointPath, item.externalId(), item.itemIdx(), franchise, education
        );
        if (syncTask == null) {
            return null;
        }

        return new FranchiseSyncCommand<>(
                syncTask,
                franchise.getId(),
                cancellationRequest
        );
    }

    private void validateRequired(String endpointPath, Object item) {
        if (endpointPath == null || item == null || endpointPath.isBlank()) {
            throw new RequiredValueMissingException();
        }
    }

    @Nullable
    private FranchiseSyncTask prepareSyncTask(
            SyncType type,
            String endpointPath,
            String externalId,
            Integer itemIdx,
            Franchise franchise
    ) {
        Optional<FranchiseSyncTask> existingTask = syncTaskManager.find(type, externalId, itemIdx);
        if (existingTask.isPresent()) {
            return canProcess(existingTask.get()) ? existingTask.get() : null;
        }

        return new FranchiseSyncTask(
                type,
                externalId,
                itemIdx,
                buildEndpointPath(endpointPath, externalId, itemIdx),
                franchise,
                null
        );
    }

    @Nullable
    private FranchiseSyncTask prepareSyncTask(
            SyncType type,
            String endpointPath,
            String externalId,
            Integer itemIdx,
            Franchise franchise,
            Education education
    ) {
        Optional<FranchiseSyncTask> existingTask = syncTaskManager.find(type, externalId, itemIdx);
        if (existingTask.isPresent()) {
            return canProcess(existingTask.get()) ? existingTask.get() : null;
        }

        return new FranchiseSyncTask(
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


    private boolean canProcess(FranchiseSyncTask syncTask) {
        return syncTask.getStatus() == SyncStatus.PENDING
                || syncTask.getStatus() == SyncStatus.RETRY;
    }

    private String buildEndpointPath(String endpointPath, String externalId, Integer itemIdx) {
        return String.format("%s?externalId=%s&itemIdx=%d", endpointPath, externalId, itemIdx);
    }
}
