package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.request.EmpAdminUpdateRequest;
import com.haruon.groupware.domain.empInfo.emp.request.EmpDeptManagerUpdateRequest;
import com.haruon.groupware.domain.empInfo.emp.request.EmpRegisterRequest;
import com.haruon.groupware.domain.empInfo.emp.request.EmpSelfUpdateRequest;
import com.haruon.groupware.domain.fixture.Email;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"emp_no", "emp_id"})})
public class Emp extends AbstractEntity {

    @Column(nullable = false)
    private String empNo;

    @Column(nullable = false)
    private String empName;

    @Column(nullable = false)
    private String empId;

    @Column(nullable = false)
    private String empPassword;

    @Embedded
    @AttributeOverride(name="email", column = @Column(name = "company_email", nullable = false, unique = true))
    private Email companyEmail;

    @Nullable
    private String extensionNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmpStatus status;

    @ElementCollection(targetClass = SystemRoleCode.class)
    @JoinTable(name = "system_roles", joinColumns = @JoinColumn(name = "emp_id"))
    @Column(name="role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<SystemRoleCode> systemRoles = new HashSet<>();

    @Nullable
    private LocalDate hiredAt;

    @Nullable
    private LocalDate resignedAt;

    @OneToMany(mappedBy = "emp", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmpFile> empFiles = new ArrayList<>();

    @OneToMany(mappedBy = "emp", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmpBelongings> empBelongings = new ArrayList<>();

    public static Emp register(EmpRegisterRequest request, PasswordEncoder passwordEncoder) {
        Emp emp = new Emp();

        emp.empNo = requireNonNull(request.empNo());
        emp.empName = requireNonNull(request.empName());
        emp.empId = requireNonNull(request.empId());
        emp.empPassword = requireNonNull(passwordEncoder.encode(request.rawPassword()));

        emp.status = EmpStatus.PENDING;

        return emp;
    }

    public void approveRegister() {
        state(this.status == EmpStatus.PENDING, "PENDING 상태가 아닙니다.");

        this.status = EmpStatus.ACTIVE;
        this.systemRoles.add(SystemRoleCode.EMPLOYEE);
    }

    public void updateInfoBySelf(EmpSelfUpdateRequest request, @Nullable PasswordEncoder encoder) {

    }

    public void updateInfoByDeptManager(EmpDeptManagerUpdateRequest request) {

    }

    public void updateInfoByAdmin(EmpAdminUpdateRequest request, @Nullable PasswordEncoder encoder) {


    }



}
