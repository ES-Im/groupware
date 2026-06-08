package com.haruon.groupware.application.draft.service.query;

import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.required.DocumentBoxQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.BelongingInfo;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class DocumentBoxQueryService implements DocumentBoxRetriever {

    private final DocumentBoxQueryRepository documentBoxQueryRepository;

    @Override
    public Page<DocumentBoxResponse> retrieveMySubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findSubmittedDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrieveMyUnsubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findUnSubmittedDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrievePendingMyApprovalDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return documentBoxQueryRepository.findPendingApprovalDraftsByEmpId(
                empId, keyword, pageable
        );
    }

    @Override
    public Page<DocumentBoxResponse> retrieveMyAccessibleDocuments(
            Long empId,
            List<BelongingInfo> belongingInfos,
            @Nullable String keyword,
            Pageable pageable
    ) {
        List<Long> deptIds = belongingInfos.stream()
                .map(BelongingInfo::deptId)
                .toList();

        return documentBoxQueryRepository.findAccessibleDraftsByEmpId(
                empId, deptIds, keyword, pageable
        );
    }
}
