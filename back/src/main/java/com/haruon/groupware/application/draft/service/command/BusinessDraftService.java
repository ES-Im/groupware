package com.haruon.groupware.application.draft.service.command;

import com.haruon.groupware.application.draft.provided.forCommand.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.required.BusinessTripDraftRepository;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.BusinessTripDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.domain.draft.BusinessTripDraft;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.employee.Emp;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static java.util.Objects.requireNonNull;

@Service
@Transactional
public class BusinessDraftService extends CommonDraftService implements BusinessTripDraftManagement {

    private final BusinessTripDraftRepository businessTripDraftRepository;

    public BusinessDraftService(
            EmpRepository empRepository,
            BusinessTripDraftRepository businessTripDraftRepository,
            FileStorage fileStorage
    ) {
        super(empRepository, businessTripDraftRepository, fileStorage);
        this.businessTripDraftRepository = businessTripDraftRepository;
    }

    @Override
    public Long createDraft(Long drafterId, BusinessTripDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();

        Emp drafter = findActiveEmpById(drafterId);

        List<Emp> participants = new ArrayList<>();
        if(req.participantIds() != null) {
            participants = getEmpListById(req.participantIds());
        }

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

        return draft.getId();
    }

    @Override
    public Long createSubmitted(Long drafterId, BusinessTripDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();

        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        List<Emp> participants = getEmpListById(requireNonNull(req.participantIds()));
        Emp drafter = findActiveEmpById(drafterId);

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

        return draft.getId();
    }

    @Override
    public void updateDraft(Long drafterEmpId, Long draftId, BusinessTripDraftUpdateRequest req) {
        BusinessTripDraft businessTripDraft = getBusinessTripDraftByDraftIdAndDrafterId(draftId, drafterEmpId);

        CommonDraftUpdateRequest commonReq = req.param();
        String editedTitle =
                (commonReq != null && commonReq.title() != null)
                        ? commonReq.title() : null;
        String editedContent =
                (commonReq != null && commonReq.content() != null)
                        ? commonReq.content() : null;

        businessTripDraft.editBusinessTripDraft(
                editedTitle, editedContent, req.startAt(), req.endAt(), req.destination(), req.purpose()
        );

        if (commonReq != null && commonReq.approvers() != null) {
            businessTripDraft.changeApprovalLine(toApproverParams(commonReq.approvers()));
        }
    }

    @Override
    public void updateParticipants(long draftId, long drafter, Set<Long> participantId) {
        BusinessTripDraft businessTripDraft = getBusinessTripDraftByDraftIdAndDrafterId(draftId, drafter);
        List<Emp> empListById = getEmpListById(participantId);

        businessTripDraft.changeParticipants(empListById);
    }

    @Override
    public void approve(long draftId, long approverId, LocalDateTime approvedAt) {
        BusinessTripDraft businessTripDraft = getBusinessTripDraftByDraftId(draftId);

        businessTripDraft.approve(
                findActiveEmpById(approverId),
                approvedAt
        );

        businessTripDraftRepository.save(businessTripDraft);
    }

    private BusinessTripDraft getBusinessTripDraftByDraftId(long draftId) {
        Draft draft = findDraftByDraftId(draftId);

        if(!(draft instanceof BusinessTripDraft businessTripDraft)) {
            throw new DraftTypeMismatchException();
        }

        return businessTripDraft;
    }

    private BusinessTripDraft getBusinessTripDraftByDraftIdAndDrafterId(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof BusinessTripDraft businessTripDraft)) {
            throw new DraftTypeMismatchException();
        }

        return businessTripDraft;
    }

}
