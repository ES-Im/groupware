package com.haruon.groupware.application.empInfo.empService;

import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.required.EmpQueryRepository;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EmpQueryService implements EmpAccountRetriever {

    private final EmpQueryRepository empQueryRepository;

    @Override
    public EmpInfoResponse retrieveEmpAccountInfo(String loginId) {
        return empQueryRepository.findEmpInfoByLoginId(loginId)
                .orElseThrow(ActiveEmployeeNotFoundException::new);
    }

    @Override
    public List<EmpFileInfo> retrieveEmpFilesInfo(String loginId) {
        return empQueryRepository.findAllEmpFileInfosByLoginId(loginId)
                .orElse(List.of());
    }

    @Override
    public List<BelongingInfo> retrieveEmpBelongingsInfo(String loginId) {
        return empQueryRepository.findAllEmpBelongingInfosByLoginId(loginId)
                .orElse(List.of());
    }
}
