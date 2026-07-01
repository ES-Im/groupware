package com.haruon.groupware.adapter.batch.franchiseSync;

import com.haruon.groupware.adapter.batch.franchiseSync.common.FranchiseSyncBatchProperties;
import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.SyncEducationCancellationItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.EducationCancellationItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.FranchiseSyncBatchItem;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncEducationCancellationItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationCancellationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@RequiredArgsConstructor
public class EducationCancellationSyncConfig {
    private final JobRepository jobRepository;

    @Bean
    public Job syncEducationCancellationJob(
            Step syncEducationCancellationStep
    ) {
        return new JobBuilder("syncEducationCancellationJob", jobRepository)
                .start(syncEducationCancellationStep)
                .build();
    }

    @Bean
    public Step syncEducationCancellationStep(
            EducationCancellationItemReader reader,
            SyncEducationCancellationItemProcessor processor,
            SyncEducationCancellationItemWriter writer,
            PlatformTransactionManager tm
    ) {
        return new StepBuilder("syncEducationCancellationStep", jobRepository)
                .<FranchiseSyncBatchItem<EducationCancellationSyncItem>, FranchiseSyncCommand<CancellationRequest>>chunk(FranchiseSyncBatchProperties.CHUNK_SIZE, tm)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
