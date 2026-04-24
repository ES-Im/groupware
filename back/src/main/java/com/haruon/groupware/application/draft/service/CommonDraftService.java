package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.dto.DraftFileCreateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.utils.Utils;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional
abstract class CommonDraftService {

    private final EmpRepository empRepository;
    private final DraftRepository draftRepository;

    public CommonDraftService(EmpRepository empRepository, DraftRepository draftRepository) {
        this.empRepository = empRepository;
        this.draftRepository = draftRepository;
    }

    public void revertToDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        draft.revertToDraft();
    }

    public void submit(long draftId, long drafterId, LocalDateTime submittedAt, @Nullable List<ApproversRequest> params) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!hasApprovers(params, draft)) throw new IllegalStateException("결재선이 없는 기안건은 상신할 수 없다");   // to-do 커스텀 예외처리

        draft.submit(submittedAt, toApproverParams(params));
    }

    public void approve(long draftId, long approverId, LocalDateTime approvedAt) {
        Draft draft = findDraftByDraftId(draftId);
        Emp approver = findActiveEmpById(approverId);

        draft.approve(approver, approvedAt);
    }

    public void reject(long draftId, long rejecterId, String reason ,LocalDateTime rejectedAt) {
        Draft draft = findDraftByDraftId(draftId);
        Emp rejector = findActiveEmpById(rejecterId);

        draft.reject(rejector, reason, rejectedAt);
    }

    public void addCirculatedEmp(long draftId, long drafterId, long circulatedEmpId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        Emp circulatedEmp = findActiveEmpById(circulatedEmpId);

        draft.addCirculation(circulatedEmp);
    }

    public void removeCirculatedEmp(long draftId, long drafterId, long circulatedEmpId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);
        Emp circulatedEmp = findActiveEmpById(circulatedEmpId);

        draft.removeCirculation(circulatedEmp);
    }

    public void addFile(long draftId, long drafterId, DraftFileCreateRequest fileParam) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        draft.addFile(
                fileParam.file().mimeType(),
                fileParam.file().originalFileName(),
                fileParam.file().extension(),
                fileParam.file().fileSize()
        );
    }

    public void removeFile(long draftId, long drafterId, long fileId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        draft.removeFile(fileId);
    }

    private boolean hasApprovers(@Nullable List<ApproversRequest> params, Draft draft) {

        return !(draft.getApproval().getApprovers().isEmpty())
                || (params != null && !params.isEmpty());
    }

    protected Emp findActiveEmpById(long empId) {
        return Utils.findActiveEmpById(empRepository, empId);
    }

    protected List<Emp> getEmpListById(Set<Long> participantId){
        return Utils.getEmpListById(empRepository ,participantId);
    }

    protected LocalDateTime requireSubmittedAt(@Nullable LocalDateTime submittedAt) {
        if (submittedAt == null) {
            throw new IllegalStateException("상신시 submittedAt 필수");   // to-do 커스텀 예외 설계 필요
        }
        return submittedAt;
    }

    protected List<ApproversParam> requireApprovers(@Nullable List<ApproversRequest> approvers) {
        if (approvers == null || approvers.isEmpty()) {
            throw new IllegalStateException("상신시 결재선 설정 필수");    // to-do 커스텀 예외 설계 필요
        }
        return toApproverParams(approvers);
    }

    protected Draft findDraftByDraftIdAndEmpId(long draftId, long empId) {
        return draftRepository.findByIdAndEmp(draftId, findActiveEmpById(empId))
                .orElseThrow(() -> new IllegalStateException("해당 기안자의 해당 기안서를 찾을 수 없음"));         // to-do 커스텀 예외 설계 필요
    }

    protected Draft findDraftByDraftId(long draftId) {
        return draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalStateException("해당 기안서를 찾을 수 없음"));         // to-do 커스텀 예외 설계 필요
    }

    protected List<ApproversParam> toApproverParams(@Nullable  List<ApproversRequest> approvers) {
        if(approvers == null) return List.of();

        List<ApproversParam> approversParams = new ArrayList<>();

        for (ApproversRequest approver : approvers) {
            Emp emp = findActiveEmpById(approver.approverId());
            approversParams.add(new ApproversParam(approver.role(), approver.order(), emp));
        }

        return approversParams;
    }

}
