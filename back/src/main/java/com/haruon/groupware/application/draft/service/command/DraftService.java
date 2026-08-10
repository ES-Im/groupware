package com.haruon.groupware.application.draft.service.command;

import com.haruon.groupware.application.draft.provided.forCommand.GeneralDraftManagement;
import com.haruon.groupware.application.draft.required.GeneralDraftRepository;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.GeneralDraft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DraftService extends CommonDraftService implements GeneralDraftManagement {

    private final GeneralDraftRepository generalDraftRepository;

    public DraftService(
            EmpRepository empRepository,
            GeneralDraftRepository generalDraftRepository
    ) {
        super(empRepository, generalDraftRepository);
        this.generalDraftRepository = generalDraftRepository;
    }

    @Override
    public Long createDraft(Long drafterId, CommonDraftCreateRequest req) {
        Emp drafter = findActiveEmpById(drafterId);

        GeneralDraft draft = GeneralDraft.createDraft(
                drafter, req.title(), req.content(), toApproverParams(req.approvers())
        );

        generalDraftRepository.save(draft);

        return draft.getId();
    }

    @Override
    public Long createSubmitted(Long drafterId, CommonDraftCreateRequest req) {
        Emp drafter = findActiveEmpById(drafterId);

        List<ApproversParam> approvers = requireApprovers(req.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(req.submittedAt());

        GeneralDraft submitted = GeneralDraft.createSubmitted(
                drafter, req.title(), req.content(),
                approvers, submittedAt
        );

        generalDraftRepository.save(submitted);

        return submitted.getId();
    }

    @Override
    public void updateDraft(Long drafterEmpId, Long draftId, CommonDraftUpdateRequest req) {
        if(req.isNotChangeCommonField()) throw new RequiredValueMissingException();

        GeneralDraft generalDraft = getGeneralDraft(draftId, drafterEmpId);

        generalDraft.editGeneralDraft (req.title(), req.content());

        if (req.approvers() != null) {
            generalDraft.changeApprovalLine(toApproverParams(req.approvers()));
        }
    }

    private GeneralDraft getGeneralDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof GeneralDraft generalDraft)) {
            throw new DraftTypeMismatchException();
        }

        return generalDraft;
    }
}
