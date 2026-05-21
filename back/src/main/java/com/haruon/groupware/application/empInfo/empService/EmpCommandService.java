package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.empService.dto.request.*;
import com.haruon.groupware.application.empInfo.leaveService.LeaveCalculator;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.empInfo.DuplicateLoginIdException;
import com.haruon.groupware.application.exception.empInfo.EmpAlreadyActiveException;
import com.haruon.groupware.application.exception.empInfo.InvalidResignDateException;
import com.haruon.groupware.application.utils.AuthorizationChecker;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import static com.haruon.groupware.application.utils.AuthorizationChecker.*;
import static com.haruon.groupware.application.utils.Utils.findEmpById;
import static com.haruon.groupware.domain.empInfo.Emp.register;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static java.util.Objects.requireNonNull;

@RequiredArgsConstructor
@Service
@Transactional
public class EmpCommandService extends LeaveCalculator implements EmpAccountManager {

    private final EmpPasswordEncoder encoder;
    private final EmpRepository empRepository;
    private final EmpLeaveRepository empLeaveRepository;
    private final CompanyPolicyPort companyPolicy;

    @Override
    public void registerEmp(EmpRegisterRequestBySelf request) {
        requireNonNull(request);

        checkDuplicateLoginId(request.loginId());
        checkDuplicateEmpNo(request.empNo());

        Emp register = register(
                request.empNo(),
                request.empName(),
                request.loginId(),
                request.rawPassword(),
                makeEmailByLoginId(request.loginId()),
                encoder
        );

        empRepository.save(register);
    }

    @Override
    public void approveRegisterByHR(EmpUpdateRequestByHR request) {
        requireNonNull(request);
        AuthorizationChecker.checkHRRoleEmp(empRepository, request.editorId());

        Emp emp = findEmpById(empRepository, request.targetEmpId());
        LocalDate hire = requireNonNull(request.hireAt());

        emp.approveRegister(hire);

        EmpLeave empLeave = createEmpLeave(
                emp,
                hire.getYear(),
                calculateTotalLeaveDays(companyPolicy, emp, hire)
        );

        empLeaveRepository.save(empLeave);
    }

    @Override
    public void updateResignedEmpByHR(EmpUpdateRequestByHR request) {
        requireNonNull(request);
        AuthorizationChecker.checkHRRoleEmp(empRepository, request.editorId());

        Emp targetEmployee = findEmpById(empRepository, request.targetEmpId());
        LocalDate resignedAt = requireNonNull(request.resignedAt());

        if(resignedAt.isBefore(targetEmployee.getHiredAt())) throw new InvalidResignDateException();

        targetEmployee.changeResignedEmpInfoByHR(resignedAt);
    }


    @Override
    public void deleteEmpFileBySelf(Long empId, Long fileId) {
        Emp emp = findActiveEmpById(empRepository, empId);

        emp.removeFile(fileId);
    }

    @Override
    public void updateEmpFileBySelf(EmpUpdateRequestBySelf request) {
        requireNonNull(request);
        Emp emp = findActiveEmpByLoginId(empRepository, request.loginId());

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
    public void updateInfoByDeptManager(EmpUpdateRequestByDeptManager request) {
        requireNonNull(request);

        DeptManagerInfo deptManagerInfo = checkDeptManagerById(empRepository, request.deptManagerId(), request.targetEmpId());

        Emp targetEmp = deptManagerInfo.targetEmp();
        targetEmp.changeInfoByDeptManager(
                request.extensionNo(),
                request.systemRoleCode()
        );
    }

    @Override
    public void updateInfoByHR(EmpUpdateRequestByHR request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, request.targetEmpId());

        if(request.belongingsParam() != null) updateBelongingsByHR(request);

        emp.changeInfoByHR(
                request.empName(),
                request.newRawPassword(),
                request.extensionNo(),
                request.empStatus(),
                request.systemRoleCode(),
                request.hireAt(),
                encoder
        );
    }

    @Override
    public void activateEmpByHR(Long editorId, Long targetId) {
        requireNonNull(editorId);
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetId);
        if(emp.getStatus().equals(EmpStatus.ACTIVE)) throw new EmpAlreadyActiveException();

        emp.activateEmp();
    }

    @Override
    public void updateInfoBySelf(EmpUpdateRequestBySelf empRequest) {
        requireNonNull(empRequest);
        Emp emp = findActiveEmpByLoginId(empRepository, empRequest.loginId());

        emp.changeInfoBySelf(
                empRequest.extensionNo(),
                empRequest.currentPassword(),
                empRequest.newRawPassword(),
                encoder
        );
    }


    @Override
    public void updateFileActiveStatusByHR(EmpUpdateRequestByHR request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.targetEmpId(), request.fileStatusParam());
    }

    @Override
    public void updateFileActiveStatusBySelf(EmpUpdateRequestBySelf request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.loginId(), request.fileStatusParam());
    }

    private Email makeEmailByLoginId(String loginId) {
        return Email.of(loginId, companyPolicy.getCompanyDomain());
    }

    private void checkDuplicateEmpNo(String empNo) {
        if (empRepository.existsByEmpNo(empNo)) { throw new DuplicateEmpNoException(); }
    }

    private void checkDuplicateLoginId(String loginId) {
        if (empRepository.existsByLoginId(loginId)) { throw new DuplicateLoginIdException(); }
    }

    private void updateFileStatus(long empId, EmpFileStatusChangeParam request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, empId);

        emp.changeFileActiveStatus(
                request.fileId(),
                request.targetActive()
        );
    }

    private void updateFileStatus(String loginId, EmpFileStatusChangeParam request) {
        requireNonNull(request);

        Emp emp = findActiveEmpByLoginId(empRepository, loginId);

        emp.changeFileActiveStatus(
                request.fileId(),
                request.targetActive()
        );
    }

    private void updateBelongingsByHR(EmpUpdateRequestByHR request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, request.targetEmpId());
        EmpBelongingsParam empBelongingsParam = requireNonNull(request.belongingsParam());

        emp.changeBelongingsByHR(
                empBelongingsParam.dept(),
                empBelongingsParam.position(),
                empBelongingsParam.isPrimary(),
                empBelongingsParam.startAt(),
                empBelongingsParam.endAt()
        );
    }
}
