package com.haruon.groupware.application.empInfo.emp.service;

import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.required.EmpQueryRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.*;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.AuthorizationValidator;
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

import static com.haruon.groupware.application.utils.AuthorizationValidator.findActiveEmpById;

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
    public List<EmpFileListInfo> retrieveEmpFilesInfo(Long empId) {
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
            AuthorizationValidator.checkHRRoleEmp(empRepository, managerOrHrId);

            return empQueryRepository.findEmpInfoList(deptId, status, keyword, pageable);
        } else if (systemRoles.contains(SystemRoleCode.DEPT_MANAGER)) {
            AuthorizationValidator.checkDeptManagerById(empRepository, managerOrHrId);

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
        AuthorizationValidator.checkHRRoleEmp(empRepository, hrEmpId);

        return empQueryRepository.findNewEmpInfoList(
                keyword, pageable
        );
    }
}
