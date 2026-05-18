package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true, exclude = {"empFiles", "empBelongings", "systemRoles", "empPassword"})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Emp extends AbstractEntity {

    private String empNo;

    private String empName;

    private String loginId;

    private String empPassword;

    private Email email;

    private EmpStatus status;

    @Nullable private String extensionNo;

    @Nullable private LocalDate hiredAt;

    @Nullable private LocalDate resignedAt;

    private Set<SystemRoleCode> systemRoles = new HashSet<>();

    private List<EmpFile> empFiles = new ArrayList<>();

    private List<EmpBelongings> empBelongings = new ArrayList<>();

    public static Emp register(
            String empNo,
            String empName,
            String loginId,
            String rawPassword,
            Email email,
            EmpPasswordEncoder empPasswordEncoder)
    {
        Emp emp = new Emp();

        emp.empNo = requireNonNull(empNo);
        emp.empName = requireNonNull(empName);
        emp.loginId = requireNonNull(loginId);
        emp.empPassword = requireNonNull(empPasswordEncoder.encode(rawPassword));
        emp.email = requireNonNull(email);

        emp.status = EmpStatus.PENDING;

        return emp;
    }

    public void approveRegister(LocalDate hiredAt) {
        state(this.status == EmpStatus.PENDING, "PENDING 상태가 아닙니다.");

        this.status = EmpStatus.ACTIVE;
        this.systemRoles.add(SystemRoleCode.EMPLOYEE);
        this.hiredAt = requireNonNull(hiredAt);
    }

    public void changeResignedEmpInfoByHR(LocalDate resignedAt) {
        requireNonNull(resignedAt, "퇴사일이 입력되지 않았습니다");
        state(hiredAt != null && resignedAt.isAfter(this.hiredAt), "퇴사일은 입사일 이후여야 합니다.");

        this.resignedAt = resignedAt;
        this.status = EmpStatus.RESIGNED;

        this.empBelongings.forEach((e) -> {
            if(e.getEndAt() == null || e.isPrimary()) {
                e.markEnd(resignedAt);
            }
        });

    }

    public void changeEmpFile(
            FileType fileType,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize) {
        ensureActive();

        deactivateFilesByType(fileType);

        this.empFiles.add(EmpFile.addFile(
                this,
                fileType,
                mimeType,
                originalName,
                extension,
                fileSize
        ));

    }

    public void changeFileActiveStatus(Long fileId, boolean active) {
        ensureActive();
        
        EmpFile targetFile = findEmpFile(fileId);

        if (active) {
            FileType targetType = targetFile.getFileType();

            this.empFiles.stream()
                    .filter(file -> file.getFileType() == targetType)
                    .filter(file -> !file.getId().equals(fileId))
                    .forEach(EmpFile::deactivateFile);

            targetFile.activateFile();
        } else {
            targetFile.deactivateFile();
        }

    }

    public void removeFile(Long fileId) {
        EmpFile targetFile = findEmpFile(fileId);

        this.empFiles.remove(targetFile);

    }

    public void changeBelongingsByHR (
            @Nullable Dept dept,
            @Nullable PositionCode position,
            @Nullable Boolean isPrimary,
            @Nullable LocalDate startAt,
            @Nullable LocalDate endAt
    ) {
        ensureActive();
        
        boolean registerCase =
                dept != null
                        && position != null
                        && isPrimary != null
                        && startAt != null;

        boolean updateCase =
                dept == null
                        && (position != null
                        || isPrimary != null
                        || startAt != null
                        || endAt != null);

        if (registerCase) {
            registerEmpBelonging(dept, position, startAt, isPrimary);
            return;
        }

        if (updateCase) {
            updateCurrentBelonging(position, isPrimary, startAt, endAt);
            return;
        }

        throw new IllegalArgumentException("소속 정보 요청 형식이 올바르지 않습니다.");
    }

    public void changeInfoBySelf(
            @Nullable String extensionNo,
            String currentPassword,
            @Nullable String newRawPassword,
            EmpPasswordEncoder encoder
    ) {
        ensureActive();
        checkPassword(currentPassword, encoder);

        boolean hasChanges = extensionNo != null || newRawPassword != null;
        state(hasChanges, "변경할 내용이 없습니다.");

        if(extensionNo != null) changeExtension(extensionNo);

        if(newRawPassword != null) changePassword(newRawPassword, encoder);

    }

    public void changeInfoByDeptManager(
            @Nullable String extensionNo,
            @Nullable SystemRoleCode systemRoleCode
    ) {
        ensureActive();

        if(systemRoleCode != null && systemRoleCode.getGrade() > SystemRoleCode.DEPT_MANAGER.getGrade()) {
            throw new IllegalArgumentException("부서시스템담당자는 부서시스템이상의 시스템권한을 부여할 수 없습니다.");
        }

        boolean hasChanges = extensionNo != null || systemRoleCode != null;
        state(hasChanges, "변경할 내용이 없습니다.");

        if(extensionNo != null) changeExtension(extensionNo);

        if(systemRoleCode != null) changeGrade(systemRoleCode);

    }

    public void changeInfoByHR(
            @Nullable String empName,
            @Nullable String newRawPassword,
            @Nullable String extensionNo,
            @Nullable EmpStatus empStatus,
            @Nullable SystemRoleCode systemRoleCode,
            @Nullable LocalDate hiredAt,
            @Nullable EmpPasswordEncoder encoder
    ) {
        ensureActive();

        boolean hasChanges = empName != null || newRawPassword != null ||
                extensionNo != null || empStatus != null || systemRoleCode != null || hiredAt != null;
        state(hasChanges, "변경할 내용이 없습니다.");

        if(empName != null) changeEmpName(empName);

        if(newRawPassword != null) changePassword(newRawPassword, encoder);

        if(extensionNo != null) changeExtension(extensionNo);

        if(empStatus != null) changeEmpStatus(empStatus);

        if(systemRoleCode != null) changeGrade(systemRoleCode);

        if(hiredAt != null) this.hiredAt = hiredAt;

    }

    public void activateEmp() {
        this.status = EmpStatus.ACTIVE;
    }

    public boolean isHR() {
        return this.getSystemRoles().contains(SystemRoleCode.HR);
    }

    private void changeEmpStatus(EmpStatus newEmpStatus) {
        this.status = newEmpStatus;
    }

    private void changeEmpName(String newEmpName) {
        this.empName = newEmpName;
    }

    private void changeGrade(SystemRoleCode newSystemRoleCode) {
        this.systemRoles.clear();
        this.systemRoles.add(newSystemRoleCode);
    }

    private void changePassword(String newRawPassword, EmpPasswordEncoder encoder) {
        requireNonNull(encoder, "비밀번호 변경을 위해 encoder가 필요합니다.");
        state(!encoder.matches(newRawPassword, this.empPassword), "새 비밀번호는 현재 비밀번호와 달라야 합니다.");

        this.empPassword = encoder.encode(newRawPassword);
    }

    private void checkPassword(String inputPassword, EmpPasswordEncoder encoder) {
        state(encoder.matches(inputPassword, this.empPassword), "현재 비밀번호가 일치하지 않습니다.");
    }

    private void changeExtension(String newExtensionNo) {
        this.extensionNo = newExtensionNo;
    }

    public void ensureActive() {
        state(this.status == EmpStatus.ACTIVE, "ACTIVE 상태가 아닙니다.");
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

    private void deactivateFilesByType(FileType targetType) {
        this.empFiles.stream()
                .filter(EmpFile::isActive)
                .filter(file -> file.getFileType() == targetType)
                .forEach(EmpFile::deactivateFile);
    }

    private void registerEmpBelonging(
            Dept dept,
            PositionCode position,
            LocalDate startAt,
            Boolean isPrimary
    ) {
        if (isPrimary) {
            this.empBelongings.forEach(EmpBelongings::unmarkPrimary);
        }

        EmpBelongings belonging = EmpBelongings.registerEmpBelonging(this, dept, position, startAt, isPrimary);

        this.empBelongings.add(belonging);
    }

    private void updateCurrentBelonging(
            @Nullable PositionCode position,
            @Nullable Boolean isPrimary,
            @Nullable LocalDate startAt,
            @Nullable LocalDate endAt
    ) {
        EmpBelongings currentBelonging = findCurrentPrimaryBelonging();

        if (position != null) {
            currentBelonging.changePosition(position);
        }

        if (isPrimary != null) {
            if (isPrimary) {
                this.empBelongings.forEach(EmpBelongings::unmarkPrimary);
                currentBelonging.markPrimary();
            } else {
                currentBelonging.unmarkPrimary();
            }
        }

        if (startAt != null) {
            currentBelonging.changeStartAt(startAt);
        }

        if (endAt != null) {
            state(!endAt.isBefore(startAt), "종료시각은 시작시간보다 이를 수 없음");

            currentBelonging.changeEndAt(endAt);
        }
    }

}
