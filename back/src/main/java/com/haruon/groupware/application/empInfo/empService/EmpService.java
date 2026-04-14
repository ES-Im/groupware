package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import com.haruon.groupware.domain.shared.Email;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import static com.haruon.groupware.application.utils.Utils.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpById;
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

        Emp emp = findEmpById(empRepository, adminRequest.id());
        LocalDate hire = requireNonNull(adminRequest.hireAt());

        emp.approveRegister(hire);
    }

    @Override
    public void updateResignedEmpByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);
        Emp emp = findEmpById(empRepository, adminRequest.id());
        LocalDate resignedAt = requireNonNull(adminRequest.resignedAt());

        emp.changeResignedEmpInfoByAdmin(resignedAt);
    }


    @Override
    public void deleteEmpFile(Long empId, Long fileId) {
        Emp emp = findActiveEmpById(empRepository, empId);

        emp.removeFile(fileId);
    }

    @Override
    public void updateEmpFileBySelf(EmpSelfUpdateRequest request) {
        requireNonNull(request);
        Emp emp = findActiveEmpById(empRepository, request.id());

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

        Emp emp = findActiveEmpById(empRepository, deptManagerRequest.id());

        emp.changeInfoByDeptManager(
                deptManagerRequest.extensionNo(),
                deptManagerRequest.systemRoleCode()
        );
    }

    @Override
    public void updateInfoByAdmin(EmpAdminUpdateRequest adminRequest) {
        requireNonNull(adminRequest);

        Emp emp = findActiveEmpById(empRepository, adminRequest.id());

        Email newEmail = adminRequest.loginId() != null
                ? makeEmailByLoginId(adminRequest.loginId())
                : null;

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
    public void updateInfoBySelf(EmpSelfUpdateRequest empRequest) {
        requireNonNull(empRequest);
        Emp emp = findActiveEmpById(empRepository, empRequest.id());

        emp.changeInfoBySelf(
                empRequest.extensionNo(),
                empRequest.currentPassword(),
                empRequest.newRawPassword(),
                encoder
        );
    }

    @Override
    public void updateBelongingsByAdmin(EmpAdminUpdateRequest request) {
        requireNonNull(request);

        Emp emp = findActiveEmpById(empRepository, request.id());
        EmpBelongingsParam empBelongingsParam = requireNonNull(request.belongingsParam());

        emp.changeBelongingsByAdmin(
                empBelongingsParam.dept(),
                empBelongingsParam.position(),
                empBelongingsParam.isPrimary(),
                empBelongingsParam.startAt(),
                empBelongingsParam.endAt()
        );
    }

    @Override
    public void updateFileActiveStatus(EmpAdminUpdateRequest request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.id(), request.fileStatusParam());
    }

    @Override
    public void updateFileActiveStatus(EmpSelfUpdateRequest request) {
        requireNonNull(request.fileStatusParam());

        updateFileStatus(request.id(), request.fileStatusParam());
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
}
