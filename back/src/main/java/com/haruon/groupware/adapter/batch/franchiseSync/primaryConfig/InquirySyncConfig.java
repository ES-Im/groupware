package com.haruon.groupware.adapter.batch.franchiseSync.primaryConfig;

import com.haruon.groupware.adapter.batch.franchiseSync.itemProcessor.primary.SyncInquiryItemProcessor;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.common.FranchiseSyncBatchItem;
import com.haruon.groupware.adapter.batch.franchiseSync.itemReader.primary.InquiryItemReader;
import com.haruon.groupware.adapter.batch.franchiseSync.itemWriter.SyncInquiryItemWriter;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.application.syncRequest.service.dto.FranchiseSyncCommand;
import com.haruon.groupware.application.syncRequest.service.dto.items.InquirySyncItem;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import static com.haruon.groupware.adapter.batch.franchiseSync.FranchiseSyncBatchProperties.CHUNK_SIZE;

@Configuration
@RequiredArgsConstructor
public class InquirySyncConfig {

    private final JobRepository jobRepository;

    @Bean
    public Job syncInquiryJob(
            Step syncInquiryStep
    ) {
        return new JobBuilder("syncInquiryJob", jobRepository)
                .start(syncInquiryStep)
                .build();
    }

    @Bean
    public Step syncInquiryStep(
            InquiryItemReader reader,
            SyncInquiryItemProcessor processor,
            SyncInquiryItemWriter writer,
            PlatformTransactionManager tm
    ) {
        return new StepBuilder("syncInquiryStep", jobRepository)
                .<FranchiseSyncBatchItem<InquirySyncItem>, FranchiseSyncCommand<InquiryRequest>>chunk(CHUNK_SIZE, tm)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
