package com.haruon.groupware.application.empInfo.deptService;

import com.haruon.groupware.application.empInfo.provided.DeptManagement;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.DeptNotFoundException;
import com.haruon.groupware.application.exception.empInfo.DuplicateDeptException;
import com.haruon.groupware.application.utils.AuthorizationChecker;
import com.haruon.groupware.domain.empInfo.Dept;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static java.util.Objects.requireNonNull;

@Service
@RequiredArgsConstructor
@Transactional
public class DeptManageService implements DeptManagement {

    private final DeptRepository deptRepository;
    private final EmpRepository empRepository;

    @Override
    public void registerDept(DeptRegisterRequest adminRequest) {
        AuthorizationChecker.checkAdminById(empRepository, adminRequest.adminId());
        requireNonNull(adminRequest);
        checkDuplicateDeptCode(adminRequest.deptName());

        Dept dept = Dept.registerDept(
                adminRequest.deptCode(),
                adminRequest.deptName()
        );

        deptRepository.save(dept);

    }

    @Override
    public void activate(Long deptId, Long adminId) {
        AuthorizationChecker.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.activate();
    }

    @Override
    public void deactivate(Long deptId, Long adminId) {
        AuthorizationChecker.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.deactivate();
    }

    @Override
    public void updateDeptName(Long deptId, String newDeptName, Long adminId) {
        AuthorizationChecker.checkAdminById(empRepository, adminId);
        checkDuplicateDeptCode(newDeptName);

        Dept dept = getDept(deptId);

        dept.renameDept(
                newDeptName
        );
    }

    private Dept getDept(Long deptId) {
        requireNonNull(deptId);

        return deptRepository.findById(deptId).orElseThrow(DeptNotFoundException::new);
    }

    private void checkDuplicateDeptCode(String deptCode) {
        requireNonNull(deptCode);

        if (deptRepository.findByDeptCode(deptCode).isPresent()) {
            throw new DuplicateDeptException();
        }
    }
}
