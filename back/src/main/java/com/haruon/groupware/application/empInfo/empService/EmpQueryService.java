package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.required.EmpQueryRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.AuthorizationChecker;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EmpQueryService implements EmpAccountRetriever {

    private final EmpQueryRepository empQueryRepository;
    private final EmpRepository empRepository;

    @Override
    public EmpInfoResponse retrieveEmpAccountInfo(Long empId) {

        return empQueryRepository.findEmpInfoByEmpId(empId)
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    @Override
    public List<EmpFileInfo> retrieveEmpFilesInfo(Long empId) {
        return empQueryRepository.findAllEmpFileInfosByEmpId(empId)
                .orElse(List.of());
    }

    @Override
    public List<BelongingInfo> retrieveEmpBelongingsInfo(Long empId) {
        return empQueryRepository.findAllEmpBelongingInfosByEmpId(empId)
                .orElse(List.of());
    }

    @Override
    public Page<EmpInfoForManagement> retrieveEmpAccountInfoListForManagement(
            Long managerOrHrId,
            List<BelongingInfo> belongings,
            @Nullable Long deptId,
            @Nullable EmpStatus status,
            @Nullable String keyword,
            Pageable pageable
    ) {
        Emp foundEmp = findActiveEmpById(empRepository, managerOrHrId);
        Set<SystemRoleCode> systemRoles = foundEmp.getSystemRoles();

        if(systemRoles.contains(SystemRoleCode.HR)) {
            AuthorizationChecker.checkHRRoleEmp(empRepository, managerOrHrId);

            return empQueryRepository.findEmpInfoList(deptId, status, keyword, pageable);
        } else if (systemRoles.contains(SystemRoleCode.DEPT_MANAGER)) {
            AuthorizationChecker.checkDeptManagerById(empRepository, managerOrHrId);

            boolean contains = belongings.stream()
                    .map(BelongingInfo::deptId)
                    .toList()
                    .contains(deptId);

            if(!contains) throw new PermissionDeniedException();

            return empQueryRepository.findEmpInfoList(deptId, status, keyword, pageable);
        }

        throw new PermissionDeniedException();
    }

    @Override
    public Page<EmpBasicInfo> retrieveNewEmpInfoList(
            Long hrEmpId,
            String keyword,
            Pageable pageable
    ) {
        AuthorizationChecker.checkHRRoleEmp(empRepository, hrEmpId);

        return empQueryRepository.findNewEmpInfoList(
                keyword, pageable
        );
    }
}
