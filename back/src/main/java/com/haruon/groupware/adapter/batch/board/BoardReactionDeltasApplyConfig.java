package com.haruon.groupware.adapter.batch.board;

import com.haruon.groupware.adapter.exception.batch.BatchJobFailedException;
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

import java.util.Map;

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

                    Map<String, Long> appliedDirtyReactionToBoardResult = applyService.applyDirtyReactionToBoard();

                    Long failedCount = appliedDirtyReactionToBoardResult.getOrDefault("failed", 0L);
                    if(failedCount > 0) {
                        String detailMessage = String.format(
                                "%s job batch 실패 : 실패건수 %d건", "boardReactionApplyStep", failedCount);

                        throw new BatchJobFailedException(detailMessage);
                    }

                    long countRemainingDirtyReactions = applyService.countRemainingDirtyReactions();

                    log.info("Board reaction delta DB apply tasklet 완료. [결과] dbAppliedBoardCount = {}, remainingDirtyBoardCount = {}",
                            appliedDirtyReactionToBoardResult.getOrDefault("applied", 0L), countRemainingDirtyReactions);

                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }


}
