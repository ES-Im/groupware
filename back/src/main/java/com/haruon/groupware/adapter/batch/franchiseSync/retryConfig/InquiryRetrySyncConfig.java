package com.haruon.groupware.adapter.batch.franchiseSync.retryConfig;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.retry.InquiryRetryItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.retry.InquiryRetryItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncInquiryItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
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
public class InquiryRetrySyncConfig {

    private final JobRepository jobRepository;
    private final FranchiseSyncProcessingTimeoutRecovery timeoutRecovery;

    @Bean
    Job retryInquirySyncJob(
            Step retryInquiryProcessingTimeoutRecoveryStep,
            Step retryInquirySyncStep
    ) {
        return new JobBuilder("retryInquirySyncJob", jobRepository)
                .start(retryInquiryProcessingTimeoutRecoveryStep)
                .next(retryInquirySyncStep)
                .build();
    }

    @Bean
    Step retryInquiryProcessingTimeoutRecoveryStep(
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryInquiryProcessingTimeoutRecoveryStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    int expiredCount = timeoutRecovery.expireProcessingTasks(SyncType.INQUIRY);
                    log.info("Inquiry PROCESSING timeout recovery completed. expiredCount={}", expiredCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    Step retryInquirySyncStep(
            InquiryRetryItemReader reader,
            InquiryRetryItemProcessor processor,
            SyncInquiryItemWriter writer,
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("retryInquirySyncStep", jobRepository)
                .<FranchiseSyncTask, FranchiseSyncCommand<InquiryRequest>>chunk(CHUNK_SIZE, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
