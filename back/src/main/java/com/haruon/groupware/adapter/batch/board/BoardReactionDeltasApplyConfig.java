package com.haruon.groupware.adapter.batch.board;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.repository.JobRepository;

/**todo
 * redis -> 전부다 조회되므로 tasklet으로 ㄱㄱ
 * -
 * 1. redis : board:reaction:dirty(Set)에서 boardId list 추출
 * 2. 해당 id에 맞는 dto- BoardReactionDelta 추출
 * 3. board에 반영
 * 4. 반영되었으면 clearDelta(boardId) 수행
 *
 */

@Slf4j
@RequiredArgsConstructor
public class BoardReactionDeltasApplyConfig {

    private final JobRepository jobRepository;

//    @Bean
//    Job boardReactionApplyJob(
//
//    ) {
//
//    }
//
//    @Bean
//    Step BoardReactionApplyStep(
//
//    ) {
//
//    }
//
//    @Bean
//    Tasklet BoardReactionApplyTasklet(
//
//    ) {
//
//    }
}
