package com.haruon.groupware.adapter.batch.franchiseSync.retryConfig;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry.EducationApplicationRetryItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry.EducationApplicationRetryItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncEducationApplicationItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
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

import static com.haruon.groupware.adapter.batch.franchiseSync.FranchiseSyncBatchProperties.CHUNK_SIZE;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class EducationApplicationRetrySyncConfig {

    private final JobRepository jobRepository;
    private final FranchiseSyncProcessingTimeoutRecovery timeoutRecovery;

    @Bean
    Job retryEducationApplicationSyncJob(
            Step retryEducationApplicationProcessingTimeoutRecoveryStep,
            Step retryEducationApplicationSyncStep
    ) {
        return new JobBuilder("retryEducationApplicationSyncJob", jobRepository)
                .start(retryEducationApplicationProcessingTimeoutRecoveryStep)
                .next(retryEducationApplicationSyncStep)
                .build();
    }

    @Bean
    Step retryEducationApplicationProcessingTimeoutRecoveryStep(
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryEducationApplicationProcessingTimeoutRecoveryStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    int expiredCount = timeoutRecovery.expireProcessingTasks(SyncType.EDUCATION_APPLICATION);
                    log.info("EducationApplication PROCESSING timeout recovery completed. expiredCount={}", expiredCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    Step retryEducationApplicationSyncStep(
            EducationApplicationRetryItemReader reader,
            EducationApplicationRetryItemProcessor processor,
            SyncEducationApplicationItemWriter writer,
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryEducationApplicationSyncStep", jobRepository)
                .<FranchiseSyncTask, FranchiseSyncCommand<ApplicationRequest>>chunk(CHUNK_SIZE, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
