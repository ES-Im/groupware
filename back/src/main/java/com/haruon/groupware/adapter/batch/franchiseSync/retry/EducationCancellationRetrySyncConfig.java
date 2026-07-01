package com.haruon.groupware.adapter.batch.franchiseSync.retry;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry.EducationCancellationRetryItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry.EducationCancellationRetryItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncEducationCancellationItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.domain.sync.FranchiseSyncTask;
import com.haruon.groupware.domain.sync.SyncType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import static com.haruon.groupware.adapter.batch.franchiseSync.common.FranchiseSyncBatchProperties.CHUNK_SIZE;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class EducationCancellationRetrySyncConfig {

    private final JobRepository jobRepository;
    private final FranchiseSyncProcessingTimeoutRecovery timeoutRecovery;

    @Bean
    Job retryEducationCancellationSyncJob(
            Step retryEducationCancellationProcessingTimeoutRecoveryStep,
            Step retryEducationCancellationSyncStep
    ) {
        return new JobBuilder("retryEducationCancellationSyncJob", jobRepository)
                .start(retryEducationCancellationProcessingTimeoutRecoveryStep)
                .next(retryEducationCancellationSyncStep)
                .build();
    }

    @Bean
    Step retryEducationCancellationProcessingTimeoutRecoveryStep(
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryEducationCancellationProcessingTimeoutRecoveryStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    int expiredCount = timeoutRecovery.expireProcessingTasks(SyncType.EDUCATION_APPLICATION_CANCEL);
                    log.info("EducationCancellation PROCESSING timeout recovery completed. expiredCount={}", expiredCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    Step retryEducationCancellationSyncStep(
            EducationCancellationRetryItemReader reader,
            EducationCancellationRetryItemProcessor processor,
            SyncEducationCancellationItemWriter writer,
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryEducationCancellationSyncStep", jobRepository)
                .<FranchiseSyncTask, FranchiseSyncCommand<CancellationRequest>>chunk(CHUNK_SIZE, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
