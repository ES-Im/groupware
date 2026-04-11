package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.required.GeneralDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class GeneralDraftService extends CommonDraftService implements GeneralDraftManagement {

    private final GeneralDraftRepository generalDraftRepository;

    public GeneralDraftService(EmpRepository empRepository, GeneralDraftRepository generalDraftRepository) {
        super(empRepository);
        this.generalDraftRepository = generalDraftRepository;
    }

    @Override
    public void createDraft(CommonDraftCreateRequest param) {

    }

    @Override
    public void createSubmitted(CommonDraftCreateRequest param) {

    }

}
