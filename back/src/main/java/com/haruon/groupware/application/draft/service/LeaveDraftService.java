package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.LeaveDraftUpdateRequest;
import com.haruon.groupware.application.draft.provided.LeaveDraftManagement;
import com.haruon.groupware.application.draft.required.LeaveDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft_approval.report.LeaveType;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.time.Duration.between;
import static org.springframework.util.Assert.state;

@Service
@Transactional
public class LeaveDraftService extends CommonDraftService implements LeaveDraftManagement {

    private final EmpRepository empRepository;
    private final LeaveDraftRepository leaveDraftRepository;

    public LeaveDraftService(EmpRepository empRepository, LeaveDraftRepository leaveDraftRepository) {
        super(empRepository, leaveDraftRepository);
        this.leaveDraftRepository = leaveDraftRepository;
        this.empRepository = empRepository;
    }

    @Override
    public void createDraft(LeaveDraftCreateRequest param) {

    }

    @Override
    public void createSubmitted(LeaveDraftCreateRequest param) {

    }

    @Override
    public void updateDraft(LeaveDraftUpdateRequest param) {

    }

    /*
     * 휴게시간 감안치 않은 계산법임, 정정하고 valdiate private 메서드 및, usedHours 계산메서드 정비할 것
     */
    private void validateLeaveTimes(LocalDateTime startAt, LocalDateTime endAt) {
        state(startAt.getMinute() == 0 && startAt.getSecond() == 0 && startAt.getNano() == 0,
                "휴가 시작시각은 정각이어야 한다.");
        state(endAt.getMinute() == 0 && endAt.getSecond() == 0 && endAt.getNano() == 0,
                "휴가 종료시각은 정각이어야 한다.");
    }

    private long calculateUsedHours(
            LocalDateTime startAt, LocalDateTime endAt,
            LocalTime companyStartAt, LocalTime companyEndAt, long requiredWorkHours,
            LeaveType leaveType
    ) {
        if(!leaveType.equals(LeaveType.ANNUAL)) return 0L;

        LocalDate startDate = startAt.toLocalDate();
        LocalDate endDate = endAt.toLocalDate();

        if(startDate.equals(endDate)) {
            return calculateDailyUsedHours(
                    startAt.toLocalTime(), endAt.toLocalTime(), companyStartAt, companyEndAt
            );
        }

        long middleDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) - 1L;

        long startDayHours = calculateDailyUsedHours(
                startAt.toLocalTime(), companyEndAt, companyStartAt, companyEndAt
        );

        long endDayHours = calculateDailyUsedHours(
                companyStartAt, endAt.toLocalTime(), companyStartAt, companyEndAt
        );

        return startDayHours + (requiredWorkHours * middleDays) + endDayHours;
    }

    private long calculateDailyUsedHours(
            LocalTime leaveStartAt, LocalTime leaveEndAt,
            LocalTime companyStartAt, LocalTime companyEndAt
    ) {
        state(!leaveEndAt.isBefore(leaveStartAt), "휴가 종료시각은 시작시각보다 이를 수 없음");
        state(!leaveStartAt.isBefore(companyStartAt), "휴가 시작시각은 회사 시작시각보다 이를 수 없음");
        state(!leaveEndAt.isAfter(companyEndAt), "휴가 종료시각은 회사 종료시각보다 늦을 수 없음");

        return between(leaveStartAt, leaveEndAt).toHours();
    }


}
