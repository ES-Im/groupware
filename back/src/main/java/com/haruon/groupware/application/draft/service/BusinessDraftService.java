package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.BusinessTripDraftUpdateRequest;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.required.BusinessTripDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class BusinessDraftService extends CommonDraftService implements BusinessTripDraftManagement {

    private final BusinessTripDraftRepository businessTripDraftRepository;

    public BusinessDraftService(EmpRepository empRepository, BusinessTripDraftRepository businessTripDraftRepository) {x
        super(empRepository);   // 헐 이거 안돼? 왜???? 왜지?
        this.businessTripDraftRepository = businessTripDraftRepository;
    }

    @Override
    public void createDraft(BusinessTripDraftCreateRequest param) {

    }

    @Override
    public void createSubmitted(BusinessTripDraftCreateRequest param) {

    }

    @Override
    public void updateDraft(BusinessTripDraftUpdateRequest param) {

    }

    @Override
    public void addBusinessTripParticipant(long draftId, long drafter, long participantId) {

    }

    @Override
    public void removeBusinessTripParticipant(long draftId, long drafter, long participantId) {

    }
}
