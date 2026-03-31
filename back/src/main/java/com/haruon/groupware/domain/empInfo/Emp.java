package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.dto.*;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import jakarta.persistence.*;
import lombok.Getter;
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
@Getter
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

    public static Emp register(EmpRegisterParam request, PasswordEncoder passwordEncoder) {
        Emp emp = new Emp();

        emp.empNo = requireNonNull(request.empNo());
        emp.empName = requireNonNull(request.empName());
        emp.empId = requireNonNull(request.empId());
        emp.empPassword = requireNonNull(passwordEncoder.encode(request.rawPassword()));

        emp.status = EmpStatus.PENDING;

        return emp;
    }

    public void removeFile(Long fileId) {
        EmpFile targetFile = findEmpFile(fileId);

        this.empFiles.remove(targetFile);
    }

    public void approveRegister(LocalDate hiredAt) {
        state(this.status == EmpStatus.PENDING, "PENDING 상태가 아닙니다.");

        this.status = EmpStatus.ACTIVE;
        this.systemRoles.add(SystemRoleCode.EMPLOYEE);
        this.hiredAt = requireNonNull(hiredAt);
    }

    public void changeResignedEmpInfoByAdmin(LocalDate resignedAt) {
        state(resignedAt != null, "퇴사일이 입력되지 않았습니다");
        state(hiredAt != null && resignedAt.isAfter(this.hiredAt), "퇴사일은 입사일 이후여야 합니다.");

        this.resignedAt = resignedAt;
        this.status = EmpStatus.RESIGNED;

        this.empBelongings.forEach((e) -> {
            if(e.getEndAt() == null || e.isPrimary()) {
                e.markEnd(resignedAt);
            }
        });
    }

    public void changeInfoBySelf(EmpSelfUpdateParam request, PasswordEncoder encoder) {
        checkActiveEmp();
        checkPassword(request.inputPassword(), encoder);

        if(request.extensionNo() != null) changeExtension(request.extensionNo());

        if(request.newRawPassword() != null) changePassword(request.newRawPassword(), encoder);

        if(request.fileRequest() != null) addFile(request.fileRequest());
    }


    public void changeInfoByDeptManager(EmpDeptManagerUpdateParam request) {
        checkActiveEmp();

        if(request.extensionNo() != null) changeExtension(request.extensionNo());

        if(request.systemRoleCode() != null) changeGrade(request.systemRoleCode());

    }

    public void changeInfoByAdmin(EmpAdminUpdateParam request, @Nullable PasswordEncoder encoder) {
        checkActiveEmp();

        if(request.empName() != null) changeEmpName(request.empName());

        if(request.empId() != null) changeEmpIdAndEmail(request.empId(), request.companyDomain());

        if(request.newRawPassword() != null) changePassword(request.newRawPassword(), encoder);

        if(request.extensionNo() != null) changeExtension(request.extensionNo());

        if(request.empStatus() != null) changeEmpStatus(request.empStatus());

        if(request.systemRoleCode() != null) changeGrade(request.systemRoleCode());

        if(request.hireAt() != null) this.hiredAt = request.hireAt();

        if(request.changeFileActive() != null) changeFileActiveStatus(request.changeFileActive());

        if(request.belongingsParam() != null) changeBelongingsByAdmin(request.belongingsParam());

    }

    private void changeEmpStatus(EmpStatus newEmpStatus) {
        this.status = newEmpStatus;
    }

    public String companyEmail() {
        return companyEmail.toString();
    }

    private void changeEmpIdAndEmail(String newEmpId, String companyDomain) {
        this.empId = newEmpId;
        this.companyEmail = new Email(newEmpId + companyDomain);
    }

    private void changeEmpName(String newEmpName) {
        this.empName = newEmpName;
    }

    private void changeGrade(SystemRoleCode newSystemRoleCode) {
        List<SystemRoleCode> deleteTarget = systemRoles.stream()
                .filter(r -> !r.isDeptType())
                .filter(r -> r.getGrade() > newSystemRoleCode.getGrade())
                .toList();

        deleteTarget.forEach(systemRoles::remove);

        this.systemRoles.add(newSystemRoleCode);
    }

    private void changePassword(String newRawPassword, PasswordEncoder encoder) {
        state(encoder != null, "비밀번호 변경을 위해 encoder가 필요합니다.");
        state(!encoder.matches(newRawPassword, this.empPassword), "새 비밀번호는 현재 비밀번호와 달라야 합니다.");

        this.empPassword = encoder.encode(newRawPassword);
    }

    private void checkPassword(String inputPassword, PasswordEncoder encoder) {
        state(encoder.matches(inputPassword, this.empPassword), "현재 비밀번호가 일치하지 않습니다.");
    }

    private void changeExtension(String newExtensionNo) {
        this.extensionNo = newExtensionNo;
    }

    private void checkActiveEmp() {
        state(this.status == EmpStatus.ACTIVE, "ACTIVE 상태가 아닙니다.");
    }


    private void changeBelongingsByAdmin(EmpBelongingsParam param) {
        boolean registerCase =
                param.dept() != null
                        && param.position() != null
                        && param.isPrimary() != null
                        && param.startAt() != null;

        boolean updateCase =
                param.dept() == null
                        && (param.position() != null
                        || param.isPrimary() != null
                        || param.startAt() != null
                        || param.endAt() != null);

        if (registerCase) {
            registerEmpBelonging(param);
            return;
        }

        if (updateCase) {
            updateCurrentBelonging(param);
            return;
        }

        throw new IllegalArgumentException("소속 정보 요청 형식이 올바르지 않습니다.");
    }

    private void registerEmpBelonging(EmpBelongingsParam param) {
        if (Boolean.TRUE.equals(param.isPrimary())) {
            this.empBelongings.forEach(EmpBelongings::unmarkPrimary);
        }

        EmpBelongings belonging = EmpBelongings.registerEmpBelonging(this, param);

        if (param.endAt() != null) {
            belonging.changeEndAt(param.endAt());
        }

        this.empBelongings.add(belonging);
    }

    private void updateCurrentBelonging(EmpBelongingsParam param) {
        EmpBelongings currentBelonging = findCurrentPrimaryBelonging();

        if (param.position() != null) {
            currentBelonging.changePosition(param.position());
        }

        if (param.isPrimary() != null) {
            if (param.isPrimary()) {
                this.empBelongings.forEach(EmpBelongings::unmarkPrimary);
                currentBelonging.markPrimary();
            } else {
                currentBelonging.unmarkPrimary();
            }
        }

        if (param.startAt() != null) {
            currentBelonging.changeStartAt(param.startAt());
        }

        if (param.endAt() != null) {
            currentBelonging.changeEndAt(param.endAt());
        }
    }

    private EmpBelongings findCurrentPrimaryBelonging() {
        return this.empBelongings.stream()
                .filter(EmpBelongings::isPrimary)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("주 소속 정보가 없습니다."));
    }

    private EmpFile findEmpFile(Long targetFileId) {
        return this.empFiles.stream()
                .filter(file -> file.getId().equals(targetFileId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("대상 파일을 찾을 수 없습니다."));
    }

    private void addFile(EmpFileParam newFile) {
        deactivateFilesByType(newFile.fileType());

        this.empFiles.add(EmpFile.addFile(this, newFile));
    }

    private void deactivateFilesByType(FileType targetType) {
        this.empFiles.stream()
                .filter(EmpFile::getIsActive)
                .filter(file -> file.getFileType() == targetType)
                .forEach(EmpFile::deactivateFile);
    }

    private void changeFileActiveStatus(EmpFileStatusChangeParam param) {
        EmpFile targetFile = findEmpFile(param.id());

        if (param.targetActive()) {
            FileType targetType = targetFile.getFileType();

            this.empFiles.stream()
                    .filter(EmpFile::getIsActive)
                    .filter(file -> file.getFileType() == targetType)
                    .filter(file -> !file.getId().equals(param.id()))
                    .forEach(EmpFile::deactivateFile);

            targetFile.activateFile();
        } else {
            targetFile.deactivateFile();
        }
    }

}
