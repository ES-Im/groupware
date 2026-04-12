package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.required.GeneralDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft_approval.report.GeneralDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class GeneralDraftService extends CommonDraftService implements GeneralDraftManagement {

    private final GeneralDraftRepository generalDraftRepository;

    public GeneralDraftService(EmpRepository empRepository, GeneralDraftRepository generalDraftRepository) {
        super(empRepository, generalDraftRepository);
        this.generalDraftRepository = generalDraftRepository;
    }

    @Override
    public void createDraft(CommonDraftCreateRequest param) {
        Emp drafter = findActiveEmpById(param.empId());

        GeneralDraft draft = GeneralDraft.createDraft(
                drafter, param.title(), param.content(), changeToApproverParams(param.approvers())
        );

        generalDraftRepository.save(draft);     // to-do : draft instanceof General test
    }

    @Override
    public void createSubmitted(CommonDraftCreateRequest param) {
        Emp drafter = findActiveEmpById(param.empId());

        hasSubmittedInfo(param.submittedAt(), param.approvers());

        GeneralDraft submitted = GeneralDraft.createSubmitted(
                drafter,
                param.title(),
                param.content(),
                changeToApproverParams(param.approvers()),
                param.submittedAt()
        );

        generalDraftRepository.save(submitted);    // to-do : draft instanceof General test
    }

}
