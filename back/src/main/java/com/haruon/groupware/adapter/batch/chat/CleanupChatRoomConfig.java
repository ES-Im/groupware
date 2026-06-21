package com.haruon.groupware.adapter.batch.chat;

import com.haruon.groupware.application.chat.provided.ChatRoomCleanup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.JobScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDate;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class CleanupChatRoomConfig {

    private final ChatRoomCleanup chatRoomCleanup;
    private final JobRepository jobRepository;

    @Bean
    Job cleanUpChatRoomJob(
            Step cleanUpChatRoomStep
    ) {
        return new JobBuilder("cleanUpChatRoomJob", jobRepository)
                .start(cleanUpChatRoomStep)
                .build();
    }

    @Bean
    @JobScope
    Step cleanUpChatRoomStep(
            @Value("#{jobParameters['cleanUpDate']}") LocalDate cleanUpDate,
            PlatformTransactionManager transactionManager) {
        return new StepBuilder("cleanUpChatRoomStep", jobRepository)
                .tasklet(((contribution, chunkContext) -> {
                    log.info("cleanUpChatRoomStep - chatRoom 정리 시작");

                    //todo ChatRoom -> 엔티티 isDeletable을 Repository에서 id들을 추출해서
                    // deletableChatRoomByBatch실행
                    // 그럼 판단다시 해야되는거 -> delete조건을 도메인 규칙이 아니라 jpqlDSL로 옳기면 더 효율적일거같은데
                    // 도메인 규칙과 검증이 중복된다. 이를 어떻게 해야할지?

                    return RepeatStatus.FINISHED;
                }), transactionManager).build();
    }



}
