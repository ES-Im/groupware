package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.EmpFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.franchise.FranchiseInquiryTest.getFranchiseInquiry;
import static com.haruon.groupware.domain.franchise.franchiseFixture.getFranchise;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

class FranchiseInquiryAnswerTest {

    @Test
    @DisplayName("답변 임시 저장")
    void createInquiryDraft_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        String content = "test";
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);

        inquiry.createAnswerDraft(content, emp);

        FranchiseInquiryAnswer answer = inquiry.getAnswer();

        assertThat(answer).extracting(
                FranchiseInquiryAnswer::getInquiry,
                FranchiseInquiryAnswer::getContent
        ).containsExactly(
                inquiry, content
        );

        assertThat(answer.getAnsweredAt())
                .as("답변 임시 저장시 답변일시필드는 null이다.")
                .isNull();
    }

    @Test
    @DisplayName("답변 수정은 답변제출 이전에 가능하다")
    void updateAnswerDraft_before_submit_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.createAnswerDraft("test", emp);

        FranchiseInquiryAnswer answer = inquiry.getAnswer();

        String newContent = "test";
        answer.updateDraft(newContent);

        assertEquals(newContent, answer.getContent());
    }

    @Test
    @DisplayName("답변 수정 시, 내용이 없다면 수정 불가")
    void updateAnswerDraft_without_content_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.createAnswerDraft("test", emp);
        FranchiseInquiryAnswer answer = inquiry.getAnswer();

        assertThatThrownBy(() ->
                inquiry.updateAnswerDraft(null, emp)
        ).isInstanceOf(NullPointerException.class);

    }

    @Test
    @DisplayName("답변 수정 시, 이미 제출된 답변건이라면 수정 불가")
    void updateAnswerDraft_after_subnmit_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.createAnswerDraft("test",emp);
        FranchiseInquiryAnswer answer = inquiry.getAnswer();
        answer.submit(LocalDateTime.of(2026,5,2,0,0,0));

        assertThatThrownBy(() ->
                inquiry.updateAnswerDraft("test2", emp)
        ).hasMessage("제출 상태에서는 답변을 수정할 수 없음");

    }

    @Test
    @DisplayName("임시저장된 답변을 제출 할 수 있다.")
    void submit_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.createAnswerDraft("test", emp);
        FranchiseInquiryAnswer answer = inquiry.getAnswer();
        LocalDateTime answerAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);

        inquiry.submitAnswer(answerAt, emp);

        assertEquals(answerAt, answer.getAnsweredAt());
    }

    @Test
    @DisplayName("임시저장된 답변을 제출시, 문의 담당자가 아닌 사원이 제출한다면 실패한다.")
    void submit_fail_when_not_assigned_emp() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp("202601001", "login1");
        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);

        inquiry.createAnswerDraft("test", emp);
        LocalDateTime answerAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);

        Emp otherEmp = EmpFixture.getApprovedEmp("202601002", "login2");
        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);

        assertThatThrownBy(() ->
                inquiry.submitAnswer(answerAt, otherEmp)
        ).hasMessage("담당자만 답변을 처리할 수 있음");


    }

    @Test
    @DisplayName("이미 제출된 답변을 다시 제출할 수 없다.")
    void already_submit_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp = EmpFixture.getApprovedEmp();

        emp.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.createAnswerDraft("test", emp);
        LocalDateTime answerAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);
        inquiry.submitAnswer(answerAt, emp);

        assertThatThrownBy(() ->
                inquiry.submitAnswer(answerAt.plusDays(1), emp)
        ).hasMessage("이미 제출된 답변");
    }

    @Test
    @DisplayName("답변 수정 시, 문의 담당자가 아닌 사원이 수정한다면 실패한다.")
    void udpate_assigned_emp_when_update_answer() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        Emp emp1 = EmpFixture.getApprovedEmp("202601001", "login1");
        emp1.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);

        inquiry.createAnswerDraft("test", emp1);

        Emp emp2 = EmpFixture.getApprovedEmp("202601001", "login1");
        emp2.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);

        assertThatThrownBy(() ->
                inquiry.updateAnswerDraft("test2", emp2)
        ).hasMessage("담당자만 답변을 처리할 수 있음");
    }

    @Test
    @DisplayName("답변 수정시, 원본 답변이 없으면 실패한다.")
    void update_answer_without_original_answer_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());

        Emp emp2 = EmpFixture.getApprovedEmp("202601001", "login1");
        emp2.changeInfoByHR(null, null, null, null, null, null, SystemRoleCode.FRANCHISE, null, null);
        inquiry.assign(emp2);

        assertThatThrownBy(() ->
                inquiry.updateAnswerDraft("test2", emp2)
        ).hasMessage("답변 초안이 없음");
    }

}