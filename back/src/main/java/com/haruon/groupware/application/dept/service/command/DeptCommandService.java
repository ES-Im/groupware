package com.haruon.groupware.application.dept.service.command;

import com.haruon.groupware.application.dept.provided.forCommand.DeptManagement;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.dept.service.command.dto.DeptRegisterRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.employee.dept.DeptNotFoundException;
import com.haruon.groupware.application.exception.employee.dept.DuplicateDeptException;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import static com.haruon.groupware.application.utils.AuthValidator.*;
import static java.util.Objects.requireNonNull;

@Service
@RequiredArgsConstructor
@Transactional
public class DeptCommandService implements DeptManagement {

    private final DeptRepository deptRepository;
    private final EmpRepository empRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public void registerDept(Long adminId, DeptRegisterRequest adminRequest) {
        checkAdminById(authorizationQueryRepository, adminId);
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
        checkAdminById(authorizationQueryRepository, adminId);
        Dept dept = getDept(deptId);

        dept.activate();
    }

    @Override
    public void deactivate(Long deptId, Long adminId) {
        checkAdminById(authorizationQueryRepository, adminId);
        Dept dept = getDept(deptId);

        dept.deactivate();
    }

    @Override
    public void updateDeptName(Long deptId, String newDeptName, Long adminId) {
        checkAdminById(authorizationQueryRepository, adminId);

        Dept dept = getDept(deptId);

        dept.renameDept(
                newDeptName
        );
    }

    @Override
    public void changeParentDept(Long deptId, @Nullable Long parentDeptId, Long adminId) {
        checkAdminById(authorizationQueryRepository, adminId);

        Dept dept = getDept(deptId);
        Dept parentDept = parentDeptId == null ? null : getDept(parentDeptId);

        dept.changeParent(parentDept);
    }

    @Override
    public void appointLeader(Long deptId, Long leaderEmpId, LocalDate startAt, Long adminId) {
        checkHRRoleEmp(authorizationQueryRepository, adminId);
        Dept dept = getDept(deptId);
        Emp leader = findActiveEmpById(empRepository, leaderEmpId);

        dept.appointLeader(leader, startAt);
    }

    @Override
    public void endCurrentLeader(Long deptId, LocalDate endAt, Long adminId) {
        checkAdminById(authorizationQueryRepository, adminId);
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
