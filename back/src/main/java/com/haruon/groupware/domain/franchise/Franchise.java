package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Franchise extends AbstractEntity {

    @Column(nullable = false)
    private String businessNumber;

    @Column(nullable = false)
    private String franchiseName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private String contactNumber;

    @Embedded
    @AttributeOverride(name="email", column = @Column(name = "contact_email", nullable = false, unique = true))
    private Email contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessStatus businessStatus;

    @Nullable
    private String memo;

    @Nullable
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Emp emp;


    public static Franchise create(
            String businessNumber,
            String franchiseName,
            String address,
            String ownerName,
            String contactNumber,
            String contactEmail,
            @Nullable Emp emp
    ) {
        Franchise franchise = new Franchise();

        franchise.businessNumber = requireNonNull(businessNumber);
        franchise.franchiseName = requireNonNull(franchiseName);
        franchise.address = requireNonNull(address);
        franchise.ownerName = requireNonNull(ownerName);
        franchise.contactNumber = requireNonNull(contactNumber);
        franchise.contactEmail = new Email(contactEmail);
        franchise.emp = emp;
        franchise.businessStatus = BusinessStatus.READY_TO_OPEN;

        return franchise;
    }

    public void changeFranchiseInfo(
            @Nullable String businessNumber,
            @Nullable String franchiseName,
            @Nullable String address,
            @Nullable String ownerName,
            @Nullable String contactNumber,
            @Nullable String  contactEmail
    ) {
        state(isChangeable(businessNumber, franchiseName, address, ownerName, contactNumber, contactEmail), "변경할 내용이 없습니다");

        this.ownerName = ownerName != null ? ownerName : this.ownerName;
        this.businessNumber = businessNumber != null ? businessNumber : this.businessNumber;
        this.franchiseName = franchiseName != null ? franchiseName : this.franchiseName;
        this.address = address != null ? address : this.address;
        this.contactNumber = contactNumber != null ? contactNumber : this.contactNumber;
        this.contactEmail = contactEmail != null ? new Email(contactEmail) : this.contactEmail;
    }


    public void changeBusinessStatus(BusinessStatus businessStatus) {
        this.businessStatus = requireNonNull(businessStatus);
    }

    public void changeManager(Emp emp) {
        requireNonNull(emp);

        state(emp.getStatus().equals(EmpStatus.ACTIVE), "활성화된 사원이 아님");
        state(emp.getSystemRoles().contains(SystemRoleCode.FRANCHISE), "가맹점 권한이 없음");

        this.emp = emp;
    }

    public void changeMemo(String memo) {
        this.memo = requireNonNull(memo);
    }

    public void clearMemo() {
        this.memo = null;
    }

    private boolean isChangeable(
            @Nullable String businessNumber,
            @Nullable String franchiseName,
            @Nullable String address,
            @Nullable String ownerName,
            @Nullable String contactNumber,
            @Nullable String  contactEmail
    ) {
        return businessNumber != null || franchiseName != null || address != null || ownerName != null || contactNumber != null || contactEmail != null;
    }


}
