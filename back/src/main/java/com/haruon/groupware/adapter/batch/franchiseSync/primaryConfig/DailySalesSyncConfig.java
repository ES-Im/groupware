package com.haruon.groupware.adapter.batch.franchiseSync.primaryConfig;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.primary.SyncDailySalesItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncBatchItem;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.primary.DailySalesItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncDailySalesItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import static com.haruon.groupware.adapter.batch.franchiseSync.FranchiseSyncBatchProperties.CHUNK_SIZE;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DailySalesSyncConfig {

    private final JobRepository jobRepository;

    @Bean
    public Job syncDailySalesJob(
            Step syncDailySalesStep
    ) {
        return new JobBuilder("syncDailySalesJob", jobRepository)
                .start(syncDailySalesStep)
                .build();
    }

    @Bean
    public Step syncDailySalesStep(
            DailySalesItemReader reader,
            SyncDailySalesItemProcessor syncDailySalesItemProcessor,
            SyncDailySalesItemWriter syncDailySalesItemWriter,
            PlatformTransactionManager tm
    ) {
        return new StepBuilder("syncDailySalesStep", jobRepository)
                .<FranchiseSyncBatchItem<DailySalesSyncItem>, FranchiseSyncCommand<DailySalesRequest>>chunk(CHUNK_SIZE, tm)
                .reader(reader)
                .processor(syncDailySalesItemProcessor)
                .writer(syncDailySalesItemWriter)
                .build();
    }
}
