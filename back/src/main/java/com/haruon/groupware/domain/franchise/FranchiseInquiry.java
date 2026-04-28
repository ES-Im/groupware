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


    public static FranchiseInquiry create(
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

    public void replace(
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

}
