package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.required.GeneralDraftRepository;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftUpdateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.GeneralDraft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.util.Assert.state;

@Service
@Transactional
public class GeneralDraftService extends CommonDraftService implements GeneralDraftManagement {

    private final GeneralDraftRepository generalDraftRepository;

    public GeneralDraftService(EmpRepository empRepository, GeneralDraftRepository generalDraftRepository) {
        super(empRepository, generalDraftRepository);
        this.generalDraftRepository = generalDraftRepository;
    }

    @Override
    public void createDraft(CommonDraftCreateRequest req) {
        Emp drafter = findActiveEmpById(req.empId());

        GeneralDraft draft = GeneralDraft.createDraft(
                drafter, req.title(), req.content(), toApproverParams(req.approvers())
        );

        generalDraftRepository.save(draft);
    }

    @Override
    public void createSubmitted(CommonDraftCreateRequest req) {
        Emp drafter = findActiveEmpById(req.empId());

        List<ApproversParam> approvers = requireApprovers(req.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(req.submittedAt());

        GeneralDraft submitted = GeneralDraft.createSubmitted(
                drafter, req.title(), req.content(),
                approvers, submittedAt
        );

        generalDraftRepository.save(submitted);
    }

    @Override
    public void updateDraft(CommonDraftUpdateRequest req) {
        state(req.isChangeCommonField(), "수정할 사항이 없음");

        GeneralDraft generalDraft = getGeneralDraft(req.draftId(), req.drafterId());

        generalDraft.editGeneralDraft (req.title(), req.content());
    }


    private GeneralDraft getGeneralDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof GeneralDraft generalDraft)) {
            throw new IllegalStateException("일반기안서가 아님");   // to-do 커스텀 예외 필요
        }

        return generalDraft;
    }
}
