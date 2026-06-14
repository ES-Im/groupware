package com.haruon.groupware.adapter.batch.board;

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

@Slf4j
@RequiredArgsConstructor
@Configuration
public class BoardReactionDeltasApplyConfig {

    private final JobRepository jobRepository;
    private final BoardReactionDeltaApplyService applyService;

    @Bean
    Job boardReactionApplyJob(
            Step boardReactionApplyStep
    ) {
        return new JobBuilder("boardReactionApplyJob", jobRepository)
                .start(boardReactionApplyStep)
                .build();
    }

    @Bean
    Step boardReactionApplyStep(
            PlatformTransactionManager transactionManager
    ) {
        return new StepBuilder("boardReactionApplyStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    log.info("Board reaction delta DB apply tasklet 시작");

                    long appliedDirtyReactionToBoard = applyService.applyDirtyReactionToBoard();

                    long countRemainingDirtyReactions = applyService.countRemainingDirtyReactions();

                    log.info("Board reaction delta DB apply tasklet 완료. [결과] dbAppliedBoardCount = {}, remainingDirtyBoardCount = {}",
                            appliedDirtyReactionToBoard, countRemainingDirtyReactions);

                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }


}
