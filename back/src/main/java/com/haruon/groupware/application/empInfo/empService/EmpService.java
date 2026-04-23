package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.leaveService.LeaveCalculator;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.application.utils.Utils;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

import static com.haruon.groupware.application.utils.Utils.*;
import static com.haruon.groupware.domain.empInfo.Emp.register;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@RequiredArgsConstructor
@Service
@Transactional
public class EmpService extends LeaveCalculator implements EmpAccountManager {

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

    private void grantAnnualLeaveForNewEmp(Emp emp, int grantedYear) {

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
        Map<String, Emp> empMap = checkDeptManagerById(empRepository, deptManagerRequest.deptManagerId(), deptManagerRequest.targetEmpId());

        Emp targetEmp = empMap.get("targetEmp");
        targetEmp.changeInfoByDeptManager(
                deptManagerRequest.extensionNo(),
                deptManagerRequest.systemRoleCode()
        );
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
