package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.franchise.FranchiseInquiryAnswer.createDraft;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FranchiseInquiry extends AbstractEntity {

    @Column(nullable = false, updatable = false, unique = true)
    private String externalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "franchise_id", nullable = false)
    private Franchise franchise;

    @Column(nullable = false)
    private String inquirerContact;

    @Column(nullable = false)
    private LocalDateTime inquiryAt;

    @Column(nullable = false)
    private String inquiryTitle;

    @Column(nullable = false)
    private String inquiryContent;

    @Nullable
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_emp_id", nullable = true)
    private Emp emp;

    @Nullable
    @OneToOne(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private FranchiseInquiryAnswer answer;


    public static FranchiseInquiry createInquiry(
            String externalId,
            Franchise franchise,
            String inquirerContact,
            LocalDateTime inquiryAt,
            String inquiryTitle,
            String inquiryContent
    ) {
        FranchiseInquiry inquiry = new FranchiseInquiry();

        inquiry.externalId = requireNonNull(externalId);
        inquiry.franchise = requireNonNull(franchise);
        inquiry.inquirerContact = requireNonNull(inquirerContact);
        inquiry.inquiryAt = requireNonNull(inquiryAt);
        inquiry.inquiryTitle = requireNonNull(inquiryTitle);
        inquiry.inquiryContent = requireNonNull(inquiryContent);
        inquiry.emp = franchise.getEmp();

        return inquiry;
    }

    public void replaceInquiry(
            String inquirerContact,
            LocalDateTime inquiryAt,
            String inquiryTitle,
            String inquiryContent
    ) {
        this.inquirerContact = requireNonNull(inquirerContact);
        this.inquiryAt = requireNonNull(inquiryAt);
        this.inquiryTitle = requireNonNull(inquiryTitle);
        this.inquiryContent = requireNonNull(inquiryContent);
    }

    public void assign(Emp emp) {
        state(emp.getStatus().equals(EmpStatus.ACTIVE), "활성화된 사원이 아님");
        state(emp.getSystemRoles().contains(SystemRoleCode.FRANCHISE), "가맹점 권한이 없음");

        this.emp = requireNonNull(emp);
    }

    public void createAnswerDraft(String content, Emp emp) {
        validateAnswerContent(content);
        assignIfUnassigned(emp);
        validateAssignedEmp(emp);

        state(this.answer == null, "이미 답변 초안이 존재함");

        this.answer = createDraft(this, content);
    }

    public void updateAnswerDraft(String content, Emp emp) {
        validateAnswerContent(content);
        validateAssignedEmp(emp);

        state(this.answer != null, "답변 초안이 없음");

        this.answer.updateDraft(content);
    }

    public void submitAnswer(LocalDateTime answerAt, Emp emp) {
        requireNonNull(answerAt);
        validateAssignedEmp(emp);

        state(this.answer != null, "답변 초안이 없음");

        this.answer.submit(answerAt);
    }

    private void assignIfUnassigned(Emp emp) {
        requireNonNull(emp, "담당 사원은 필수");

        if (this.emp == null) {
            assign(emp);
        }
    }

    private void validateAssignedEmp(Emp emp) {
        requireNonNull(emp, "담당 사원은 필수");
        state(this.emp != null, "담당자가 배정되지 않음");
        state(this.emp.equals(emp), "담당자만 답변을 처리할 수 있음");
    }

    private static void validateAnswerContent(String content) {
        requireNonNull(content, "답변은 필수");
        state(!content.isBlank(), "답변은 공백이 될 수 없음");
    }

}
