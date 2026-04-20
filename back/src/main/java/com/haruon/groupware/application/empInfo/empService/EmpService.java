package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.application.utils.Utils;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.utils.Utils.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpById;
import static com.haruon.groupware.domain.empInfo.Emp.register;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@RequiredArgsConstructor
@Service
@Transactional
public class EmpService implements EmpAccountManager {

    private final PasswordEncoder encoder;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort companyPolicy;

    @Override
    public void registerEmp(EmpRegisterRequest registerRequest) {
        requireNonNull(registerRequest);

        checkDuplicateLoginId(registerRequest.loginId());
        checkDuplicateEmpNo(registerRequest.empNo());

        Emp register = register(
                registerRequest.empNo(),
                registerRequest.empName(),
                registerRequest.loginId(),
                registerRequest.rawPassword(),
                makeEmailByLoginId(registerRequest.loginId()),
                encoder
        );

        empRepository.save(register);
    }

    @Override
    public void approveRegisterByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);
        Utils.checkAdminById(empRepository, adminRequest.adminId());

        Emp emp = findEmpById(empRepository, adminRequest.targetEmpId());
        LocalDate hire = requireNonNull(adminRequest.hireAt());

        emp.approveRegister(hire);
    }

    @Override
    public void updateResignedEmpByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);
        Utils.checkAdminById(empRepository, adminRequest.adminId());

        Emp targetEmployee = findEmpById(empRepository, adminRequest.targetEmpId());
        LocalDate resignedAt = requireNonNull(adminRequest.resignedAt());

        state(resignedAt.isAfter(targetEmployee.getHiredAt()), "퇴직일자가 입사일자보다 이를수 없다");

        targetEmployee.changeResignedEmpInfoByAdmin(resignedAt);
    }


    @Override
    public void deleteEmpFile(Long empId, Long fileId) {
        Emp emp = findActiveEmpById(empRepository, empId);

        emp.removeFile(fileId);
    }

    @Override
    public void updateEmpFileBySelf(EmpSelfUpdateRequest request) {
        requireNonNull(request);
        Emp emp = findActiveEmpById(empRepository, request.empId());

        EmpFileReplaceParam fileParam = requireNonNull(request.fileRequest());

        emp.changeEmpFile(
                fileParam.fileType(),
                fileParam.file().mimeType(),
                fileParam.file().originalFileName(),
                fileParam.file().extension(),
                fileParam.file().fileSize()
        );
    }

    @Override
    public void updateInfoByDeptManager(EmpDeptManagerUpdateRequest deptManagerRequest) {
        requireNonNull(deptManagerRequest);
        Utils.checkDeptById(empRepository, deptManagerRequest.deptManagerId());

        Emp deptManager = findActiveEmpById(empRepository, deptManagerRequest.deptManagerId());
        Set<Dept> managerDept = getCurrentDept(deptManager);

        Emp targetEmp = findActiveEmpById(empRepository, deptManagerRequest.targetEmpId());
        Set<Dept> targetEmpDept = getCurrentDept(targetEmp);

        validateSameDept(managerDept, targetEmpDept);

        targetEmp.changeInfoByDeptManager(
                deptManagerRequest.extensionNo(),
                deptManagerRequest.systemRoleCode()
        );
    }

    private Set<Dept> getCurrentDept(Emp emp) {
        return emp.getEmpBelongings().stream()
                .filter(b -> b.getEndAt() == null)
                .map(EmpBelongings::getDept)
                .collect(Collectors.toSet());
    }

    private void validateSameDept(Set<Dept> managerDept, Set<Dept> targetEmpDept) {
        boolean isSameDept = false;
        for (Dept dept : managerDept) {
            isSameDept = targetEmpDept.contains(dept);
            break;
        }

        state(isSameDept, "부서 매니저의 부서가 수정대상 사원과 다른 부서");
    }

    @Override
    public void updateInfoByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);

        Emp emp = findActiveEmpById(empRepository, adminRequest.targetEmpId());

        Email newEmail = adminRequest.loginId() != null
                ? makeEmailByLoginId(adminRequest.loginId())
                : null;
        if(adminRequest.belongingsParam() != null) updateBelongingsByAdmin(adminRequest);

        emp.changeInfoByAdmin(
                adminRequest.empName(),
                adminRequest.loginId(),
                newEmail,
                adminRequest.newRawPassword(),
                adminRequest.extensionNo(),
                adminRequest.empStatus(),
                adminRequest.systemRoleCode(),
                adminRequest.hireAt(),
                encoder
        );
    }

    @Override
    public void activateEmpByAdmin(Long adminId, Long targetId) {
        requireNonNull(adminId);
        Utils.checkAdminById(empRepository, adminId);

        Emp emp = findEmpById(empRepository, targetId);
        state(!emp.getStatus().equals(EmpStatus.ACTIVE), "이미 활성화된 직원입니다.");

        emp.activateEmp();
    }

    @Override
    public void updateInfoBySelf(EmpSelfUpdateRequest empRequest) {
        requireNonNull(empRequest);
        Emp emp = findActiveEmpById(empRepository, empRequest.empId());

        emp.changeInfoBySelf(
                empRequest.extensionNo(),
                empRequest.currentPassword(),
                empRequest.newRawPassword(),
                encoder
        );
    }


    @Override
    public void updateFileActiveStatus(EmpAdminUpdateRequest request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.targetEmpId(), request.fileStatusParam());
    }

    @Override
    public void updateFileActiveStatus(EmpSelfUpdateRequest request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.empId(), request.fileStatusParam());
    }

    private Email makeEmailByLoginId(String loginId) {
        return Email.of(loginId, companyPolicy.getCompanyDomain());
    }

    private void checkDuplicateEmpNo(String empNo) {
        if (empRepository.existsByEmpNo(empNo)) { throw new RuntimeException("이미 있는 사원번호"); } // to-do : 향후 커스텀 예외 처리
    }

    private void checkDuplicateLoginId(String loginId) {
        if (empRepository.existsByLoginId(loginId)) { throw new RuntimeException("이미 있는 아이디"); } // to-do : 향후 커스텀 예외 처리
    }

    private void updateFileStatus(long empId, EmpFileStatusChangeParam request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, empId);

        emp.changeFileActiveStatus(
                request.fileId(),
                request.targetActive()
        );
    }

    private void updateBelongingsByAdmin(EmpAdminUpdateRequest request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, request.targetEmpId());
        EmpBelongingsParam empBelongingsParam = requireNonNull(request.belongingsParam());

        emp.changeBelongingsByAdmin(
                empBelongingsParam.dept(),
                empBelongingsParam.position(),
                empBelongingsParam.isPrimary(),
                empBelongingsParam.startAt(),
                empBelongingsParam.endAt()
        );
    }
}
