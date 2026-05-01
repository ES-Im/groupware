package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.InquiryRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;
import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Slf4j
@TestIntegrationConfig
record AnswerManagementTest(
        FranchiseInquiryRepository inquiryRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        InquiryImporter importer,
        FranchiseManagement franchiseManagement,
        AnswerManagement answerManagement
) {

    @AfterEach
    void tearDown() {
        inquiryRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원에 한하여, 문의 담당자를 배정할 수 있다.")
    void assign_answer_to_who_has_franchise_role_success() {
        Emp franchiseEmp = getFranchiseEmp("202601101", "franchise101");
        FranchiseInquiry inquiry = getSavedInquiry();

        answerManagement.assignEmpToAnswer(inquiry.getId(), franchiseEmp.getId());

        FranchiseInquiry foundInquiry
                = inquiryRepository.findById(inquiry.getId()).orElseThrow();

        assertEquals(foundInquiry.getEmp(), franchiseEmp);
    }

    @Test
    @DisplayName("담당자는 답변을 작성할 수 있다")
    void create_answer_draft_by_assigned_emp_success() {
        Emp franchiseEmp = getFranchiseEmp("202601101", "franchise101");
        FranchiseInquiry inquiry = getSavedInquiry();

        answerManagement.assignEmpToAnswer(inquiry.getId(), franchiseEmp.getId());

        String answer = "test";

        answerManagement.createAnswerDraft(inquiry.getId(), franchiseEmp.getId(), answer);

        FranchiseInquiry foundInquiry
                = inquiryRepository.findById(inquiry.getId()).orElseThrow();

        assertNotNull(foundInquiry.getAnswer());
        assertEquals(answer, foundInquiry.getAnswer().getContent());
    }
    
    @Test
    @DisplayName("담당자는 답변을 수정할 수 있다.")
    void update_answer_draft_by_assigned_emp_success() {
        Emp franchiseEmp = getFranchiseEmp("202601101", "franchise101");
        FranchiseInquiry inquiry = getSavedInquiry();

        answerManagement.assignEmpToAnswer(inquiry.getId(), franchiseEmp.getId());


        answerManagement.createAnswerDraft(inquiry.getId(), franchiseEmp.getId(), "test");
        String editedAnswer = "editedTest";

        answerManagement.updateAnswerDraft(inquiry.getId(), franchiseEmp.getId(), editedAnswer);
        FranchiseInquiry foundInquiry
                = inquiryRepository.findById(inquiry.getId()).orElseThrow();

        assertNotNull(foundInquiry.getAnswer());
        assertEquals(editedAnswer, foundInquiry.getAnswer().getContent());
    }

    @Test
    @DisplayName("담당자는 답변을 발송할 수 있다.")
    void send_answer_by_assigned_emp_success() {
        Emp franchiseEmp = getFranchiseEmp("202601101", "franchise101");
        FranchiseInquiry inquiry = getSavedInquiry();
        answerManagement.assignEmpToAnswer(inquiry.getId(), franchiseEmp.getId());
        answerManagement.createAnswerDraft(inquiry.getId(), franchiseEmp.getId(), "test");

        LocalDateTime sentAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);
        answerManagement.sendAnswer(inquiry.getId(), franchiseEmp.getId(), sentAt);

        FranchiseInquiry foundInquiry
                = inquiryRepository.findById(inquiry.getId()).orElseThrow();

        assertNotNull(foundInquiry.getAnswer());
        assertEquals(sentAt, foundInquiry.getAnswer().getAnsweredAt());
    }

    private FranchiseInquiry getSavedInquiry() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );

        long inquiryId = importer.importInquiry(
                franchise.getId(),
                InquiryRequest.builder()
                        .externalId("external")
                        .inquirerContact("010-1234-5678")
                        .inquiryAt(LocalDateTime.of(2026,4,1,9,0,0))
                        .inquiryTitle("title")
                        .inquiryContent("content")
                        .build()
        );

        return inquiryRepository.findById(inquiryId).orElseThrow();
    }

    private Emp getFranchiseEmp(String empNo, String loginId) {
        return getSavedFranchiseEmp(deptRepository, empRepository, empNo, loginId);
    }

}