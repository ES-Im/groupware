package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.DraftFileRequest;
import com.haruon.groupware.domain.draft_approval.report.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 *  기안서의 상신, 공람, 파일관련 메서드를 제공
 */
public interface DraftManagement {

    /** about draft */
    void revertToDraft(long draftId, long empId);

    void submit(long draftId, long empId, LocalDateTime submittedAt, @Nullable List<ApproversParam> params);

    /** about approve */
    void approve(long draftId, Emp approver, LocalDateTime approvedAt);
    // -> 모든 승인 끝나면 markReadByCirculation 호출

    void reject(long draftId, Emp approver, LocalDateTime rejectedAt);

    /** about circulation */
    void addCirculatedEmp(long draftId, long empId, Emp circulatedEmp);

    void removeCirculatedEmp(long draftId, long empId, Emp circulatedEmp);

    // isReadableByCirculation -> 조회용, 공람자 리스트 출력시 사용할 것

    /** about file */
    void addFile(long draftId, long empId, DraftFileRequest fileParam);

    void removeFile(long draftId, long empId, long fileId);

}
