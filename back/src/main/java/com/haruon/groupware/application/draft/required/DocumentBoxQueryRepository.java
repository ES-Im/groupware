package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DocumentBoxQueryRepository {

    Page<DocumentBoxResponse> findSubmittedDraftsByEmpId(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> findUnSubmittedDraftsByEmpId(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> findPendingApprovalDraftsByEmpId(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> findAccessibleDraftsByEmpId(
            Long empId,
            List<Long> deptIds,
            @Nullable String keyword,
            Pageable pageable
    );
}
