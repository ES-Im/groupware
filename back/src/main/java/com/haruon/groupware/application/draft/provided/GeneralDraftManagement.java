package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.dto.DraftFileCreateRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 일반 기안서의 작성, 수정, 상신을 제공
 */
public interface GeneralDraftManagement {

    /** about general draft */
    void createDraft(CommonDraftCreateRequest param);

    void createSubmitted(CommonDraftCreateRequest param);

    void updateDraft(CommonDraftUpdateRequest param);

    /** about draft */
    void revertToDraft(long draftId, long drafterId);

    void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> params);

    /** about approve */
    void approve(long draftId, long approverId, LocalDateTime approvedAt);
    // -> 모든 승인 끝나면 markReadByCirculation 호출

    void reject(long draftId, long rejecterId, String reason, LocalDateTime rejectedAt);

    /** about circulation */
    void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId);

    // isReadableByCirculation -> 조회용, 공람자 리스트 출력시 사용할 것

    /** about file */
    void addFile(long draftId, long drafterId, DraftFileCreateRequest fileParam);

    void removeFile(long draftId, long drafterId, long fileId);

}
