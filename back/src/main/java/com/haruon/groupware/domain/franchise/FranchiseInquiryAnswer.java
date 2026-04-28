package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FranchiseInquiryAnswer extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="inquiry_id", nullable = false)
    private FranchiseInquiry inquiry;

    @Column(nullable = false)
    private String content;

    @Nullable
    private LocalDateTime answeredAt;

    public static FranchiseInquiryAnswer createDraft(
            FranchiseInquiry inquiry,
            String content
    ) {
        FranchiseInquiryAnswer answer = new FranchiseInquiryAnswer();

        answer.inquiry = requireNonNull(inquiry);
        answer.content = requireNonNull(content);

        return answer;
    }

    public void updateDraft(String content) {
        state(this.answeredAt == null, "제출 상태에서는 답변을 수정할 수 없음");

        this.content = requireNonNull(content);
    }

    public void submit(LocalDateTime answerAt) {
        state(this.answeredAt == null, "이미 제출된 답변");

        this.answeredAt = requireNonNull(answerAt);
    }



}
