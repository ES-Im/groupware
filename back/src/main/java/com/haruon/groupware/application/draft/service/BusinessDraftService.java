package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.BusinessTripDraftUpdateRequest;
import com.haruon.groupware.application.draft.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.required.BusinessTripDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;

@Service
@Transactional
public class BusinessDraftService extends CommonDraftService implements BusinessTripDraftManagement {

    private final EmpRepository empRepository;
    private final BusinessTripDraftRepository businessTripDraftRepository;

    public BusinessDraftService(EmpRepository empRepository, BusinessTripDraftRepository businessTripDraftRepository) {
        super(empRepository, businessTripDraftRepository);
        this.businessTripDraftRepository = businessTripDraftRepository;
        this.empRepository = empRepository;
    }

    @Override
    public void createDraft(BusinessTripDraftCreateRequest request) {
        CommonDraftCreateRequest commonDraftRequest = request.param();

        Emp drafter = findActiveEmpById(commonDraftRequest.empId());

        BusinessTripDraft draft = BusinessTripDraft.createDraft(
                drafter, commonDraftRequest.title(), commonDraftRequest.content(),
                request.startAt(), request.endAt(), request.destination(), request.purpose(),
                changeToEmpList(request.participantsId()), changeToApproverParams(request.param().approvers())
        );

        businessTripDraftRepository.save(draft);
    }

    @Override
    public void createSubmitted(BusinessTripDraftCreateRequest request) {
        CommonDraftCreateRequest commonDraftRequest = request.param();
        requireNonNull(commonDraftRequest.approvers());
        requireNonNull(request.participantsId());
        hasSubmittedInfo(commonDraftRequest.submittedAt(), commonDraftRequest.approvers());

        Emp drafter = findActiveEmpById(commonDraftRequest.empId());

        BusinessTripDraft draft = BusinessTripDraft.createSubmitted(
                drafter, commonDraftRequest.title(), commonDraftRequest.content(),
                request.startAt(), request.endAt(), request.destination(), request.purpose(),
                changeToEmpList(request.participantsId()), changeToApproverParams(request.param().approvers()),
                commonDraftRequest.submittedAt()
        );



        businessTripDraftRepository.save(draft);     // to-do : draft instanceof General test
    }

    @Override
    public void updateDraft(BusinessTripDraftUpdateRequest param) {

    }

    @Override
    public void addParticipant(long draftId, long drafter, long participantId) {

    }

    @Override
    public void removeParticipant(long draftId, long drafter, long participantId) {

    }

    private List<Emp> changeToEmpList(@Nullable List<Long> participantsId) {
        if(participantsId == null) return List.of();

        List<Emp> empList = new ArrayList<>();

        for (Long participantId : participantsId) {
            Emp emp = findActiveEmpById(participantId);
            empList.add(emp);
        }

        return empList;
    }

}