package com.haruon.groupware.application.draft.required;


import com.haruon.groupware.domain.draft.LeaveDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.draft.sub.LeaveType;

import java.util.List;
import java.util.Optional;

public interface LeaveDraftRepository extends DraftRepository {

    LeaveDraft save(LeaveDraft leaveDraft);

    Optional<LeaveDraft> findById(Long id);

    List<LeaveDraft> findByEmpIdAndLeaveTypeAndApproval_StatusInAndId_Not(
            Long empId,
            LeaveType leaveType,
            List<ApprovalStatus> statuses,
            Long id
    );

    List<LeaveDraft> findByEmpIdAndLeaveTypeAndApproval_StatusIn(
            Long empId,
            LeaveType leaveType,
            List<ApprovalStatus> statuses
    );

}
