package com.haruon.groupware.application.empInfo.emp.service;

import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.*;
import com.haruon.groupware.application.empInfo.leave.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.leave.service.LeaveCalculator;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.empInfo.emp.*;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.utils.AuthorizationValidator;
import com.haruon.groupware.application.utils.AuthorizationValidator.DeptManagerInfo;
import com.haruon.groupware.application.utils.required.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Set;

import static com.haruon.groupware.application.utils.AuthorizationValidator.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpById;
import static com.haruon.groupware.domain.empInfo.Emp.register;
import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;

@RequiredArgsConstructor
@Service
@Transactional
public class EmpCommandService extends LeaveCalculator implements EmpAccountManager {

    private final EmpPasswordEncoder encoder;
    private final EmpRepository empRepository;
    private final EmpLeaveRepository empLeaveRepository;
    private final CompanyPolicyPort companyPolicy;
    private final FileStorage fileStorage;


    /**
     *  본인 정보 등록 / 수정
     */
    @Override
    public void registerEmp(EmpRegisterRequest request) {
        if(request == null) throw new RequiredValueMissingException();

        checkDuplicateLoginId(request.loginId());
        checkDuplicateEmpNo(request.empNo());

        Emp register = register(
                request.empNo(),
                request.name(),
                request.loginId(),
                request.password(),
                makeEmailByLoginId(request.loginId()),
                encoder
        );

        empRepository.save(register);
    }

    @Override
    public void updateInfoBySelf(
            EmpUpdateRequestBySelf empRequest,
            Long empId
    ) {
        if(empRequest == null) throw new RequiredValueMissingException();
        Emp emp = findActiveEmpById(empRepository, empId);

        if(empRequest.newRawPassword() != null) {
            validateNewPassword(empRequest.newRawPassword(), emp.getEmpPassword());
        }

        emp.changeInfoBySelf(
                empRequest.extensionNo(),
                empRequest.newRawPassword(),
                encoder
        );
    }

    @Override
    public void updateFileActiveStatusBySelf(
            Long targetFileId, Boolean isForActivate,
            Long empId
    ) {
        Emp emp = findActiveEmpById(empRepository, empId);

        emp.changeFileActiveStatus(
                targetFileId,
                isForActivate
        );
    }

    /**
     *  모든사원 정보 등록 / 수정 (By HR)
     */
    @Override
    public void approveRegisterByHR(Long editorId, Long targetEmpId, LocalDate hiredAt) {
        if(hiredAt == null) throw new RequiredValueMissingException();

        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetEmpId);

        emp.approveRegister(hiredAt);

        EmpLeave empLeave = createEmpLeave(
                emp,
                hiredAt.getYear(),
                calculateTotalLeaveDays(companyPolicy, emp, hiredAt)
        );

        empLeaveRepository.save(empLeave);
    }

    @Override
    public void updateResignedEmpByHR(Long editorId, Long targetEmpId, LocalDate resignedAt) {
        if(resignedAt == null) throw new RequiredValueMissingException();
        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp targetEmployee = findEmpById(empRepository, targetEmpId);

        if(resignedAt.isBefore(targetEmployee.getHiredAt())) throw new InvalidResignDateException();

        targetEmployee.changeResignedEmpInfoByHR(resignedAt);
    }

    @Override
    public void updateInfoByHR(Long editorId, Long targetEmpId, EmpUpdateRequestByHR request) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        validateHRRoleOrAdmin(editor);
        validateAssignableRolesByHR(editor, request.systemRoleCode());

        Emp emp = findActiveEmpById(empRepository, targetEmpId);

        if(request.password() != null) {
            validateNewPassword(request.password(), emp.getEmpPassword());
        }

        emp.changeInfoByHR(
                request.empName(),
                request.password(),
                request.extensionNo(),
                request.systemRoleCode(),
                request.hireAt(),
                encoder
        );
    }

    @Override
    public void updateBelongingsByHR(EmpBelongingsParam request, Long editorId) {
        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findActiveEmpById(empRepository, request.targetEmpId());

        emp.changeBelongingsByHR(
                request.dept(),
                request.position(),
                request.isPrimary(),
                request.startAt(),
                request.endAt()
        );
    }

    @Override
    public void activateEmpByHR(Long editorId, Long targetId) {
        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetId);
        if(emp.getStatus().equals(EmpStatus.ACTIVE)) throw new EmpAlreadyActiveException();

        emp.activateEmp();
    }

    @Override
    public void suspendEmpByHR(Long editorId, Long targetId) {
        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetId);
        if(!emp.getStatus().equals(EmpStatus.ACTIVE)) throw new EmpIsNotActiveException();

        emp.suspendEmp();
    }

    @Override
    public void updateFileActiveStatusByHR(
            Long editorId, Long targetEmpId,
            Long targetFileId, Boolean isForActivate
    ) {
        AuthorizationValidator.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetEmpId);

        emp.changeFileActiveStatus(
                targetFileId,
                isForActivate
        );
    }

    /**
     *  같은 부서 사원의 정보 등록 / 수정 (By DeptManager)
     */
    @Override
    public void updateInfoByDeptManager(Long managerId, Long targetEmpId, EmpUpdateRequestByDeptManager request) {
        DeptManagerInfo deptManagerInfo = AuthorizationValidator.checkDeptManagerByIdAndEmpId(empRepository, managerId, targetEmpId);

        validateAssignableRolesByDeptManager(deptManagerInfo.manager(), request.systemRoleCode());

        Emp targetEmp = deptManagerInfo.targetEmp();
        targetEmp.changeInfoByDeptManager(
                request.extensionNo(),
                request.systemRoleCode()
        );
    }



    private void validateHRRoleOrAdmin(Emp editor) {
        if (editor.isHR() || editor.isAdmin()) return;

        throw new PermissionDeniedException();
    }

    private void validateAssignableRolesByHR(Emp editor, @Nullable Set<SystemRoleCode> requestedRoles) {
        if (requestedRoles == null || editor.isAdmin()) return;

        boolean hasNotAssignableRole = requestedRoles.stream()
                .anyMatch(role -> !role.canBeGrantedByHr());

        if (hasNotAssignableRole) {
            throw new PermissionDeniedException();
        }
    }

    private void validateAssignableRolesByDeptManager(Emp manager, @Nullable Set<SystemRoleCode> requestedRoles) {
        if (requestedRoles == null) return;

        Set<SystemRoleCode> managerRoles = manager.getSystemRoles();

        for (SystemRoleCode role : requestedRoles) {
            boolean isDefaultAssignableRole = role == SystemRoleCode.EMPLOYEE || role == SystemRoleCode.DEPT_MANAGER;
            boolean isOwnedDeptRole = role.isDeptType() && managerRoles.contains(role);

            if (!isDefaultAssignableRole && !isOwnedDeptRole) {
                throw new PermissionDeniedException();
            }
        }
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

    private void validateNewPassword(String newPassword, String oldPassword) {
        if(encoder.matches(newPassword, oldPassword)) {
            throw new InvalidPasswordException();
        }
    }

}
