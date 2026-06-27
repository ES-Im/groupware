package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryQueryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
@Transactional
record FranchiseInquiryQueryRepositoryAdapterTest(
        FranchiseInquiryQueryRepository inquiryQueryRepository,
        FranchiseInquiryRepository inquiryRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository
) {

    private static final AtomicInteger EMP_NO = new AtomicInteger(700000);

    @BeforeEach
    void setUp() {
        clean();
    }

    @AfterEach
    void tearDown() {
        clean();
    }

    @Test
    @DisplayName("문의 상세 조회 - 문의 본문과 실제 문의 담당자를 조회한다")
    void findInquiryById_success() {
        String token = token();
        Emp firstManager = saveEmp("first-" + token);
        Emp changedManager = saveEmp("changed-" + token);
        Franchise franchise = saveFranchise(firstManager, token);
        FranchiseInquiry inquiry = saveInquiry(franchise, token, "detail", "문의 본문");
        inquiry.assign(changedManager);

        InquireDetailResponse response = inquiryQueryRepository.findInquiryById(inquiry.getId()).orElseThrow();

        assertThat(response).extracting(
                InquireDetailResponse::inquirerContact,
                InquireDetailResponse::inquiryContent,
                InquireDetailResponse::assignedManagerId,
                InquireDetailResponse::assignedManagerName
        ).containsExactly(
                "010-1234-5678",
                "문의 본문",
                changedManager.getId(),
                changedManager.getEmpName()
        );
    }

    @Test
    @DisplayName("문의 목록 조회 - 답변 초안은 미답변으로 조회한다")
    void findInquiries_byAnswered_success() {
        String token = token();
        Emp manager = saveEmp("list-" + token);
        Franchise franchise = saveFranchise(manager, token);
        FranchiseInquiry noAnswer = saveInquiry(franchise, token, "no-answer", "미답변");
        FranchiseInquiry draft = saveInquiry(franchise, token, "draft", "초안");
        draft.createAnswerDraft("답변 초안", manager);
        FranchiseInquiry submitted = saveInquiry(franchise, token, "submitted", "제출");
        submitted.createAnswerDraft("제출 답변", manager);
        submitted.submitAnswer(LocalDateTime.of(2026, 6, 1, 10, 30), manager);

        Page<InquiriesResponse> answered = inquiryQueryRepository.findInquiries(
                true, manager.getId(), token, null, null, PageRequest.of(0, 10)
        );
        Page<InquiriesResponse> notAnswered = inquiryQueryRepository.findInquiries(
                false, manager.getId(), token, null, null, PageRequest.of(0, 10)
        );

        assertThat(answered.getContent()).singleElement().satisfies(response ->
                assertThat(response).extracting(
                        InquiriesResponse::inquiryId,
                        InquiriesResponse::isAnswered,
                        InquiriesResponse::assignedManagerId
                ).containsExactly(
                        submitted.getId(),
                        true,
                        manager.getId()
                )
        );
        assertThat(notAnswered.getContent())
                .extracting(InquiriesResponse::inquiryId, InquiriesResponse::isAnswered)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(noAnswer.getId(), false),
                        org.assertj.core.groups.Tuple.tuple(draft.getId(), false)
                );
    }

    @Test
    @DisplayName("답변 조회 - 제출 상태와 답변 담당자를 함께 조회한다")
    void findAnswerByInquiryId_success() {
        String token = token();
        Emp manager = saveEmp("answer-" + token);
        Franchise franchise = saveFranchise(manager, token);
        FranchiseInquiry inquiry = saveInquiry(franchise, token, "answer", "문의 본문");
        LocalDateTime answeredAt = LocalDateTime.of(2026, 6, 1, 11, 0);
        inquiry.createAnswerDraft("답변 내용", manager);
        inquiry.submitAnswer(answeredAt, manager);

        AnswerResponse response = inquiryQueryRepository.findAnswerByInquiryId(inquiry.getId()).orElseThrow();

        assertThat(response).extracting(
                AnswerResponse::content,
                AnswerResponse::isSubmitted,
                AnswerResponse::answeredAt,
                AnswerResponse::answeredEmpId,
                AnswerResponse::answeredEmpName
        ).containsExactly(
                "답변 내용",
                true,
                answeredAt,
                manager.getId(),
                manager.getEmpName()
        );
    }

    private void clean() {
        inquiryRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    private Emp saveEmp(String loginId) {
        return getSavedFranchiseEmp(
                deptRepository,
                empRepository,
                String.valueOf(EMP_NO.incrementAndGet()),
                loginId
        );
    }

    private Franchise saveFranchise(Emp manager, String token) {
        return franchiseRepository.save(Franchise.create(
                "000-00-" + token.substring(0, 5),
                "Inquiry Query " + token,
                "Seoul " + token,
                "Owner " + token,
                "010-1234-5678",
                "inquiry-query-" + token + "@example.com",
                manager
        ));
    }

    private FranchiseInquiry saveInquiry(
            Franchise franchise,
            String token,
            String title,
            String content
    ) {
        return inquiryRepository.save(FranchiseInquiry.createInquiry(
                "inquiry-query-" + token + "-" + title,
                franchise,
                "010-1234-5678",
                LocalDateTime.of(2026, 6, 1, 9, 0),
                "Inquiry Query " + token + " " + title,
                content
        ));
    }

    private String token() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }
}
