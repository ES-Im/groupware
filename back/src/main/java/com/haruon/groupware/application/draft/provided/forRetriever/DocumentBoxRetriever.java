package com.haruon.groupware.application.draft.provided.forRetriever;

import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.BelongingInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DocumentBoxRetriever {

    Page<DocumentBoxResponse> retrieveMySubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> retrieveMyUnsubmittedDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> retrievePendingMyApprovalDrafts(
            Long empId,
            @Nullable String keyword,
            Pageable pageable
    );

    Page<DocumentBoxResponse> retrieveMyAccessibleDocuments(
            Long empId,
            List<BelongingInfo> belongingInfos,
            @Nullable String keyword,
            Pageable pageable
    );


}
