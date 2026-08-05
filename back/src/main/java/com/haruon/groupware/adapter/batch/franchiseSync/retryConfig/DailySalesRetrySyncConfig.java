package com.haruon.groupware.adapter.batch.franchiseSync.retryConfig;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry.DailySalesRetryItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry.DailySalesRetryItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncDailySalesItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
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
public class DailySalesRetrySyncConfig {

    private final JobRepository jobRepository;
    private final FranchiseSyncProcessingTimeoutRecovery timeoutRecovery;

    @Bean
    Job retryDailySalesSyncJob(
            Step retryDailySalesProcessingTimeoutRecoveryStep,
            Step retryDailySalesSyncStep
    ) {
        return new JobBuilder("retryDailySalesSyncJob", jobRepository)
                .start(retryDailySalesProcessingTimeoutRecoveryStep)
                .next(retryDailySalesSyncStep)
                .build();
    }

    @Bean
    Step retryDailySalesProcessingTimeoutRecoveryStep(
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryDailySalesProcessingTimeoutRecoveryStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    int expiredCount = timeoutRecovery.expireProcessingTasks(SyncType.DAILY_SALES);
                    log.info("DailySales PROCESSING timeout recovery completed. expiredCount={}", expiredCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    Step retryDailySalesSyncStep(
            DailySalesRetryItemReader reader,
            DailySalesRetryItemProcessor processor,
            SyncDailySalesItemWriter writer,
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryDailySalesSyncStep", jobRepository)
                .<FranchiseSyncTask, FranchiseSyncCommand<DailySalesRequest>>chunk(CHUNK_SIZE, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
