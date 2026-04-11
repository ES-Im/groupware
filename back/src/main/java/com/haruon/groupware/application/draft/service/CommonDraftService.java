package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.DraftFileRequest;
import com.haruon.groupware.application.draft.provided.DraftManagement;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft_approval.report.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public abstract class CommonDraftService implements DraftManagement {

    private final EmpRepository empRepository;

    @Override
    public void revertToDraft(long draftId, long empId) {

    }

    @Override
    public void submit(long draftId, long empId, LocalDateTime submittedAt, @Nullable List<ApproversParam> params) {

    }

    @Override
    public void approve(long draftId, Emp approver, LocalDateTime approvedAt) {

    }

    @Override
    public void reject(long draftId, Emp approver, LocalDateTime rejectedAt) {

    }

    @Override
    public void addCirculatedEmp(long draftId, long empId, Emp circulatedEmp) {

    }

    @Override
    public void removeCirculatedEmp(long draftId, long empId, Emp circulatedEmp) {

    }

    @Override
    public void addFile(long draftId, long empId, DraftFileRequest fileParam) {

    }

    @Override
    public void removeFile(long draftId, long empId, long fileId) {

    }
}
