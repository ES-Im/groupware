package com.haruon.groupware.domain.franchise;

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
    void createDraft_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        String content = "test";

        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, content);

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
    void updateDraft_before_submit_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, "test");

        String newContent = "test";
        answer.updateDraft(newContent);

        assertEquals(newContent, answer.getContent());
    }

    @Test
    @DisplayName("답변 수정 시, 내용이 없다면 수정 불가")
    void updateDraft_without_content_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, "test");

        assertThatThrownBy(() ->
                answer.updateDraft(null)
        ).isInstanceOf(NullPointerException.class);

    }

    @Test
    @DisplayName("답변 수정 시, 이미 제출된 답변건이라면 수정 불가")
    void updateDraft_after_subnmit_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, "test");
        answer.submit(LocalDateTime.of(2026,5,2,0,0,0));

        assertThatThrownBy(() ->
                answer.updateDraft(null)
        ).hasMessage("제출 상태에서는 답변을 수정할 수 없음");

    }

    @Test
    @DisplayName("임시저장된 답변을 제출 할 수 있다.")
    void submit_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, "test");
        LocalDateTime answerAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);
        answer.submit(answerAt);

        assertEquals(answerAt, answer.getAnsweredAt());
    }

    @Test
    @DisplayName("이미 제출된 답변을 다시 제출할 수 없다.")
    void already_submit_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        FranchiseInquiryAnswer answer = FranchiseInquiryAnswer.createDraft(inquiry, "test");
        LocalDateTime answerAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);

        answer.submit(answerAt);

        assertThatThrownBy(() ->
                answer.submit(answerAt.plusDays(1))
        ).hasMessage("이미 제출된 답변");
    }
}