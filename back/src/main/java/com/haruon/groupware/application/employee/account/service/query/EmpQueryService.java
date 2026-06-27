package com.haruon.groupware.application.employee.account.service.query;

import com.haruon.groupware.application.employee.account.provided.forRetriever.EmpAccountRetriever;
import com.haruon.groupware.application.employee.account.required.EmpQueryRepository;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.employee.account.service.query.dto.*;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.AuthValidator.*;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EmpQueryService implements EmpAccountRetriever {

    private final EmpQueryRepository empQueryRepository;
    private final EmpRepository empRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

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
            checkHRRoleEmp(authorizationQueryRepository, managerOrHrId);

            return empQueryRepository.findEmpInfoList(deptId, status, keyword, pageable);
        } else if (systemRoles.contains(SystemRoleCode.DEPT_MANAGER)) {

            if(deptId == null) throw new PermissionDeniedException();
            checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, managerOrHrId, deptId);

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
        checkHRRoleEmp(authorizationQueryRepository, hrEmpId);

        return empQueryRepository.findNewEmpInfoList(
                keyword, pageable
        );
    }
}
