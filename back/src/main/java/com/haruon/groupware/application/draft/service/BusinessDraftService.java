package com.haruon.groupware.application.draft.service;

import com.haruon.groupware.application.draft.dto.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.BusinessTripDraftUpdateRequest;
import com.haruon.groupware.application.draft.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.CommonDraftUpdateRequest;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.required.BusinessTripDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.draft_approval.report.ApproversParam;
import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.Draft;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class BusinessDraftService extends CommonDraftService implements BusinessTripDraftManagement {

    private final BusinessTripDraftRepository businessTripDraftRepository;

    public BusinessDraftService(EmpRepository empRepository, BusinessTripDraftRepository businessTripDraftRepository) {
        super(empRepository, businessTripDraftRepository);
        this.businessTripDraftRepository = businessTripDraftRepository;
    }

    @Override
    public void createDraft(BusinessTripDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();

        Emp drafter = findActiveEmpById(commonReq.empId());
        List<Emp> participants = toEmpList(req.participantIds());
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());

        BusinessTripDraft draft = BusinessTripDraft.createDraft(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.startAt(),
                req.endAt(),
                req.destination(),
                req.purpose(),
                participants,
                approvers
        );


        businessTripDraftRepository.save(draft);
    }

    @Override
    public void createSubmitted(BusinessTripDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();

        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        List<Emp> participants = toEmpList(req.participantIds());
        Emp drafter = findActiveEmpById(commonReq.empId());

        BusinessTripDraft draft = BusinessTripDraft.createSubmitted(
                drafter,
                commonReq.title(),
                commonReq.content(),
                req.startAt(),
                req.endAt(),
                req.destination(),
                req.purpose(),
                participants,
                approvers, submittedAt
        );

        businessTripDraftRepository.save(draft);
    }

    @Override
    public void updateDraft(BusinessTripDraftUpdateRequest req) {
        CommonDraftUpdateRequest commonReq = req.param();
        BusinessTripDraft businessTripDraft = getBusinessTripDraft(commonReq.draftId(), commonReq.empId());

        businessTripDraft.editBusinessTripDraft(
                commonReq.title(), commonReq.content(), req.startAt(), req.endAt(), req.destination(), req.purpose()
        );
    }


    @Override
    public void addParticipant(long draftId, long drafter, List<Long> participantIds) {
        BusinessTripDraft businessTripDraft = getBusinessTripDraft(draftId, drafter);

        if (participantIds.isEmpty()) throw new IllegalArgumentException("출장 참여자 정보가 없음");

        for (Long participantId : participantIds) {
            Emp participant = findActiveEmpById(participantId);

            businessTripDraft.addParticipant(participant);
        }

    }

    @Override
    public void removeParticipant(long draftId, long drafter, List<Long> participantIds) {
        BusinessTripDraft businessTripDraft = getBusinessTripDraft(draftId, drafter);

        if (participantIds.isEmpty()) throw new IllegalArgumentException("출장 참여자 정보가 없음");

        for (Long participantId : participantIds) {
            Emp participant = findActiveEmpById(participantId);

            businessTripDraft.removeParticipant(participant);
        }
    }

    private List<Emp> toEmpList(@Nullable List<Long> participantIds) {
        if(participantIds == null) return List.of();

        List<Emp> empList = new ArrayList<>();

        for (Long participantId : participantIds) {
            Emp emp = findActiveEmpById(participantId);
            empList.add(emp);
        }

        return empList;
    }


    private BusinessTripDraft getBusinessTripDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof BusinessTripDraft businessTripDraft)) {
            throw new IllegalArgumentException("출장기안서가 아님");
        }

        return businessTripDraft;
    }

}