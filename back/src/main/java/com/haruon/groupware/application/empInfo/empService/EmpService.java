package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.empInfo.empService.dto.EmpAdminUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpDeptManagerUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpSelfUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.param.EmpBelongingsParam;
import com.haruon.groupware.application.empInfo.empService.dto.param.EmpFileReplaceParam;
import com.haruon.groupware.application.empInfo.empService.dto.param.EmpFileStatusChangeParam;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.Utils.findEmpById;
import static com.haruon.groupware.domain.empInfo.Emp.register;
import static java.util.Objects.requireNonNull;

@RequiredArgsConstructor
@Service
@Transactional
public class EmpService implements EmpAccountManager {

    private final PasswordEncoder encoder;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort companyPolicy;

    @Override
    public int registerEmp(EmpRegisterRequest registerRequest) {
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

        Emp saved = empRepository.save(register);

        return 1;
    }

    @Override
    public int approveRegisterByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);
        Emp emp = findEmpById(empRepository, adminRequest.id());

        return emp.approveRegister(adminRequest.hireAt());
    }

    @Override
    public int updateResignedEmpByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);
        Emp emp = findEmpById(empRepository, adminRequest.id());

        return emp.changeResignedEmpInfoByAdmin(adminRequest.resignedAt());
    }


    @Override
    public int deleteEmpFile(Long empId, Long fileId) {
        Emp emp = findEmpById(empRepository, empId);

        return emp.removeFile(fileId);
    }

    @Override
    public int updateEmpFileBySelf(EmpSelfUpdateRequest request) {
        requireNonNull(request);

        Emp emp = findEmpById(empRepository, request.id());
        EmpFileReplaceParam fileParam = request.fileRequest();

        return emp.changeEmpFile(
                fileParam.fileType(),
                fileParam.mimeType(),
                fileParam.getOriginalFileName(),
                fileParam.getExtension(),
                fileParam.fileSize()
        );
    }

    @Override
    public int updateInfoByDeptManager(EmpDeptManagerUpdateRequest deptManagerRequest) {
        requireNonNull(deptManagerRequest);

        Emp emp = findEmpById(empRepository, deptManagerRequest.id());

        return emp.changeInfoByDeptManager(
                deptManagerRequest.extensionNo(),
                deptManagerRequest.systemRoleCode()
        );
    }

    @Override
    public int updateInfoByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);

        Emp emp = findEmpById(empRepository, adminRequest.id());

        Email newEmail = adminRequest.loginId() != null
                ? makeEmailByLoginId(adminRequest.loginId())
                : null;

        return emp.changeInfoByAdmin(
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
    public int updateInfoBySelf(EmpSelfUpdateRequest empRequest) {
        requireNonNull(empRequest);
        Emp emp = findEmpById(empRepository, empRequest.id());

        return emp.changeInfoBySelf(
                empRequest.extensionNo(),
                empRequest.currentPassword(),
                empRequest.newRawPassword(),
                encoder
        );
    }

    @Override
    public int updateBelongingsByAdmin(EmpAdminUpdateRequest request) {
        requireNonNull(request);

        Emp emp = findEmpById(empRepository, request.id());
        EmpBelongingsParam empBelongingsParam = request.belongingsParam();


        return emp.changeBelongingsByAdmin(
                empBelongingsParam.dept(),
                empBelongingsParam.position(),
                empBelongingsParam.isPrimary(),
                empBelongingsParam.startAt(),
                empBelongingsParam.endAt()
        );
    }

    @Override
    public int updateFileActiveStatus(EmpAdminUpdateRequest request) {    // empSelf, admin
        return updateFileStatus(request.id(), request.fileStatusParam());
    }

    @Override
    public int updateFileActiveStatus(EmpSelfUpdateRequest request) {
        return updateFileStatus(request.id(), request.fileStatusParam());
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

    private int updateFileStatus(long empId, EmpFileStatusChangeParam request) {
        requireNonNull(request);

        Emp emp = findEmpById(empRepository, empId);

        return emp.changeFileActiveStatus(
                request.fileId(),
                request.targetActive()
        );
    }
}
