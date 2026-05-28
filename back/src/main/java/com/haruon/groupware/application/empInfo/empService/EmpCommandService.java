package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.empService.dto.request.*;
import com.haruon.groupware.application.empInfo.leaveService.LeaveCalculator;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.empInfo.*;
import com.haruon.groupware.application.file.dto.result.StoreFile;
import com.haruon.groupware.application.file.required.FileStorage;
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
    public void updateEmpFileBySelf(
            EmpFileReplaceParam fileParam,
            Long loginId
    ) {
        if(fileParam == null) throw new RequiredValueMissingException();
        Emp emp = findActiveEmpById(empRepository, loginId);

        StoreFile storedFile = fileStorage.store(fileParam.file(), fileParam.fileType().name());

        emp.changeEmpFile(
                fileParam.fileType(),
                storedFile.mimeType(),
                storedFile.originalName(),
                storedFile.storedName(),
                storedFile.extension(),
                storedFile.fileSize(),
                storedFile.storedPath()
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

    @Override
    public void deleteEmpFileBySelf(Long fileId, Long empId) {
        Emp emp = findActiveEmpById(empRepository, empId);

        emp.removeFile(fileId);
    }




    /**
     *  모든사원 정보 등록 / 수정 (By HR)
     */
    @Override
    public void approveRegisterByHR(Long editorId, Long targetEmpId, LocalDate hiredAt) {
        if(hiredAt == null) throw new RequiredValueMissingException();

        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

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
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

        Emp targetEmployee = findEmpById(empRepository, targetEmpId);

        if(resignedAt.isBefore(targetEmployee.getHiredAt())) throw new InvalidResignDateException();

        targetEmployee.changeResignedEmpInfoByHR(resignedAt);
    }

    @Override
    public void updateInfoByHR(EmpUpdateRequestByHR request, Long editorId) {
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findActiveEmpById(empRepository, request.targetEmpId());

        if(request.newRawPassword() != null) {
            validateNewPassword(request.newRawPassword(), emp.getEmpPassword());
        }

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
    public void updateBelongingsByHR(EmpBelongingsParam request, Long editorId) {
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

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
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

        Emp emp = findEmpById(empRepository, targetId);
        if(emp.getStatus().equals(EmpStatus.ACTIVE)) throw new EmpAlreadyActiveException();

        emp.activateEmp();
    }


    @Override
    public void updateFileActiveStatusByHR(
            Long editorId, Long targetEmpId,
            Long targetFileId, Boolean isForActivate
    ) {
        AuthorizationChecker.checkHRRoleEmp(empRepository, editorId);

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
    public void updateInfoByDeptManager(EmpUpdateRequestByDeptManager request, Long managerId) {
        DeptManagerInfo deptManagerInfo = checkDeptManagerById(empRepository, managerId, request.targetEmpId());

        Emp targetEmp = deptManagerInfo.targetEmp();
        targetEmp.changeInfoByDeptManager(
                request.extensionNo(),
                request.systemRoleCode()
        );
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
