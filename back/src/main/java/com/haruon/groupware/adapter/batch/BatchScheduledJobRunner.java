package com.haruon.groupware.adapter.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BatchScheduledJobRunner {

    private final JobLauncher jobLauncher;
    private final Job boardReactionApplyJob;

    @Scheduled(cron = "0 0 * * * *")
    public void boardReactionApplyJobRunner() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {

        JobParameters jobParameters = new JobParametersBuilder()
                .addLong("scheduledAt", System.currentTimeMillis())
                .toJobParameters();

        JobExecution execution = jobLauncher.run(boardReactionApplyJob, jobParameters);

        log.info("job status={}, exitStatus={}",
                execution.getStatus(),
                execution.getExitStatus());
    }

}
