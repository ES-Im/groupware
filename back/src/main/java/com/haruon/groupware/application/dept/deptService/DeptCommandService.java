package com.haruon.groupware.application.dept.deptService;

import com.haruon.groupware.application.dept.deptService.dto.request.DeptRegisterRequest;
import com.haruon.groupware.application.dept.provided.DeptManagement;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.empInfo.dept.DeptNotFoundException;
import com.haruon.groupware.application.exception.empInfo.dept.DuplicateDeptException;
import com.haruon.groupware.application.utils.AuthorizationValidator;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import static com.haruon.groupware.application.utils.AuthorizationValidator.findActiveEmpById;
import static java.util.Objects.requireNonNull;

@Service
@RequiredArgsConstructor
@Transactional
public class DeptCommandService implements DeptManagement {

    private final DeptRepository deptRepository;
    private final EmpRepository empRepository;

    @Override
    public void registerDept(Long adminId, DeptRegisterRequest adminRequest) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);
        requireNonNull(adminRequest);
        checkDuplicateDeptCode(adminRequest.deptCode());

        Dept dept = Dept.registerDept(
                adminRequest.deptCode(),
                adminRequest.deptName()
        );

        deptRepository.save(dept);

    }

    @Override
    public void activate(Long deptId, Long adminId) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.activate();
    }

    @Override
    public void deactivate(Long deptId, Long adminId) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.deactivate();
    }

    @Override
    public void updateDeptName(Long deptId, String newDeptName, Long adminId) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);

        Dept dept = getDept(deptId);

        dept.renameDept(
                newDeptName
        );
    }

    @Override
    public void changeParentDept(Long deptId, @Nullable Long parentDeptId, Long adminId) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);

        Dept dept = getDept(deptId);
        Dept parentDept = parentDeptId == null ? null : getDept(parentDeptId);

        dept.changeParent(parentDept);
    }

    @Override
    public void appointLeader(Long deptId, Long leaderEmpId, LocalDate startAt, Long adminId) {
        AuthorizationValidator.checkHRRoleEmp(empRepository, adminId);
        Dept dept = getDept(deptId);
        Emp leader = findActiveEmpById(empRepository, leaderEmpId);

        dept.appointLeader(leader, startAt);
    }

    @Override
    public void endCurrentLeader(Long deptId, LocalDate endAt, Long adminId) {
        AuthorizationValidator.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.endCurrentLeader(endAt);
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
