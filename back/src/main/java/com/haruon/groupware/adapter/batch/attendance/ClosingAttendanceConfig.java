package com.haruon.groupware.adapter.batch.attendance;

import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceClosing;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.AttendanceCloseRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.JdbcPagingItemReader;
import org.springframework.batch.item.database.Order;
import org.springframework.batch.item.database.builder.JdbcPagingItemReaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.Map;

/**
 * - 청크 + 페이징 기반으로 진행
 * 1. read -> 활성화된 직원 id 추출
 * 2. process -> 마감용 DTO로 변환
 * 3. write -> 마감 로직 실행
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ClosingAttendanceConfig {

    private final JobRepository jobRepository;
    private final AttendanceClosing attendanceClosing;
    private final DataSource dataSource;

    @Bean
    Job closingAttendanceJob(
            Step attendanceClosingStep
    ) {
        return new JobBuilder("closingAttendanceJob", jobRepository)
                .start(attendanceClosingStep)
                .build();
    }

    @Bean
    Step attendanceClosingStep(
            PlatformTransactionManager transactionManager,
            ItemReader<Long> closingAttendanceReader,
            ItemProcessor<Long, AttendanceCloseRequest> closingAttendanceProcessor,
            ItemWriter<AttendanceCloseRequest> closingAttendanceWriter
    ) {
        return new StepBuilder("closingAttendanceStep", jobRepository)
                .<Long, AttendanceCloseRequest>chunk(100, transactionManager)
                .reader(closingAttendanceReader)
                .processor(closingAttendanceProcessor)
                .writer(closingAttendanceWriter)
                .build();
    }

    @Bean
    ItemWriter<AttendanceCloseRequest> closingAttendanceWriter() {
        return chunk -> {
            for (AttendanceCloseRequest request : chunk) {
                attendanceClosing.closeAttendance(request);
            }
        };
    }

    @Bean
    @StepScope
    ItemProcessor<Long, AttendanceCloseRequest> closingAttendanceProcessor(
            @Value("#{jobParameters['attendanceDate']}") LocalDate attendanceDate
    ) {
        return empId -> new AttendanceCloseRequest(empId, attendanceDate);
    }

    @Bean
    JdbcPagingItemReader<Long> closingAttendanceReader() {
        return new JdbcPagingItemReaderBuilder<Long>()
                .name("closingAttendanceReader")
                .dataSource(dataSource)
                .rowMapper((rs, rowNum) -> rs.getLong("id"))
                .pageSize(100)
                .selectClause("SELECT id")
                .fromClause("FROM emp")
                .whereClause("WHERE status = :status")
                .parameterValues(Map.of("status", "ACTIVE"))
                .sortKeys(Map.of("id", Order.ASCENDING))
                .build();
    }
}