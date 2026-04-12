package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.ApproversRequest;
import com.haruon.groupware.application.draft.dto.DraftFileRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 *  기안서의 상신, 공람, 파일관련 메서드를 제공
 */
public interface DraftManagement {

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
    void addFile(long draftId, long drafterId, DraftFileRequest fileParam);

    void removeFile(long draftId, long drafterId, long fileId);

}
