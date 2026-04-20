package com.haruon.groupware.application.empInfo.deptService;

import com.haruon.groupware.application.empInfo.provided.DeptManagement;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.Utils;
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
        Utils.checkAdminById(empRepository, adminRequest.adminId());
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
        Utils.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.activate();
    }

    @Override
    public void deactivate(Long deptId, Long adminId) {
        Utils.checkAdminById(empRepository, adminId);
        Dept dept = getDept(deptId);

        dept.deactivate();
    }

    @Override
    public void updateDeptName(Long deptId, String newDeptName, Long adminId) {
        Utils.checkAdminById(empRepository, adminId);
        checkDuplicateDeptCode(newDeptName);

        Dept dept = getDept(deptId);

        dept.renameDept(
                newDeptName
        );
    }

    private Dept getDept(Long deptId) {
        requireNonNull(deptId);

        return deptRepository.findById(deptId).orElseThrow(() ->
                new RuntimeException("조회된 부서가 없음")  // to-do 커스텀 예외처리 필요
        );
    }

    private void checkDuplicateDeptCode(String deptCode) {
        requireNonNull(deptCode);

        if (deptRepository.findByDeptCode(deptCode).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 부서 코드");
        }
    }
}
