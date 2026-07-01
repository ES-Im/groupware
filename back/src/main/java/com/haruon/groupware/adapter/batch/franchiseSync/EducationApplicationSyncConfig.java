package com.haruon.groupware.adapter.batch.franchiseSync;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.SyncEducationApplicationItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.EducationApplicationItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.FranchiseSyncBatchItem;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncEducationApplicationItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.EducationApplicationSyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import static com.haruon.groupware.adapter.batch.franchiseSync.common.FranchiseSyncBatchProperties.CHUNK_SIZE;

@Configuration
@RequiredArgsConstructor
public class EducationApplicationSyncConfig {

    private final JobRepository jobRepository;

    @Bean
    public Job syncEducationApplicationJob(
            Step syncEducationApplicationStep
    ) {
        return new JobBuilder("syncEducationApplicationJob", jobRepository)
                .start(syncEducationApplicationStep)
                .build();
    }

    @Bean
    public Step syncEducationApplicationStep(
            EducationApplicationItemReader reader,
            SyncEducationApplicationItemProcessor processor,
            SyncEducationApplicationItemWriter writer,
            PlatformTransactionManager tm
    ) {
        return new StepBuilder("syncEducationApplicationStep", jobRepository)
                .<FranchiseSyncBatchItem<EducationApplicationSyncItem>, FranchiseSyncCommand<ApplicationRequest>>chunk(CHUNK_SIZE, tm)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
