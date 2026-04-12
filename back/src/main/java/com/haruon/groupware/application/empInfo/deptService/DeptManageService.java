package com.haruon.groupware.application.empInfo.deptService;

import com.haruon.groupware.application.empInfo.provided.DeptManagement;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static java.util.Objects.requireNonNull;

@Service
@RequiredArgsConstructor
@Transactional
public class DeptManageService implements DeptManagement {

    private final DeptRepository  deptRepository;

    @Override
    public int registerDept(DeptRegisterRequest adminRequest) {
        requireNonNull(adminRequest);
        checkDuplicateDeptCode(adminRequest.deptName());

        Dept dept = Dept.registerDept(
                adminRequest.deptCode(),
                adminRequest.deptName()
        );

        deptRepository.save(dept);

        return 1;
    }

    @Override
    public int activate(Long deptId) {
        Dept dept = getDept(deptId);

        dept.activate();

        return 1;
    }

    @Override
    public int deactivate(Long deptId) {
        Dept dept = getDept(deptId);

        dept.deactivate();

        return 1;
    }

    @Override
    public int updateDeptName(Long deptId, String newDeptName) {
        checkDuplicateDeptCode(newDeptName);

        Dept dept = getDept(deptId);

        dept.renameDept(
                newDeptName
        );

        return 0;
    }

    private Dept getDept(Long deptId) {
        requireNonNull(deptId);

        return deptRepository.findById(deptId).orElseThrow(() ->
                new RuntimeException("조회된 부서가 없음")  // to-do 커스텀 예외처리 필요
        );
    }

    private Dept checkDuplicateDeptCode(String deptCode) {
        requireNonNull(deptCode);
        return deptRepository.findByDeptCode(deptCode).orElseThrow(() ->
                new RuntimeException("이미 존재하는 부서 코드")  // to-do 커스텀 예외처리 필요
        );
    }
}
