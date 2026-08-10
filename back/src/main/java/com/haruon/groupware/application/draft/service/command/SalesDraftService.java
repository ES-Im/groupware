package com.haruon.groupware.application.draft.service.command;


import com.haruon.groupware.application.draft.provided.forCommand.SalesDraftManagement;
import com.haruon.groupware.application.draft.required.SalesDraftRepository;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.SalesDraftUpdateRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.draft.DraftTypeMismatchException;
import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.SalesDraft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SalesDraftService extends CommonDraftService implements SalesDraftManagement {

    private final SalesDraftRepository salesDraftRepository;
    private final FranchiseRepository franchiseRepository;

    public SalesDraftService(
            EmpRepository empRepository,
            SalesDraftRepository salesDraftRepository,
            FranchiseRepository franchiseRepository,
            FileStorage fileStorage
    ) {
        super(empRepository, salesDraftRepository, fileStorage);
        this.salesDraftRepository = salesDraftRepository;
        this.franchiseRepository = franchiseRepository;
    }

    @Override
    public Long createDraft(Long drafterEmpId, SalesDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(drafterEmpId);
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());
        Franchise franchise = findFranchise(req);

        SalesDraft draft = SalesDraft.createDraft(
                drafter,
                franchise,
                commonReq.title(),
                commonReq.content(),
                req.reportMonth(),
                req.salesAmount(),
                approvers
        );

        salesDraftRepository.save(draft);

        return draft.getId();
    }

    @Override
    public Long createSubmitted(Long drafterEmpId, SalesDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(drafterEmpId);
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());
        Franchise franchise = findFranchise(req);

        SalesDraft draft = SalesDraft.createSubmitted(
                drafter,
                franchise,
                commonReq.title(),
                commonReq.content(),
                req.reportMonth(),
                req.salesAmount(),
                approvers,
                submittedAt
        );

        salesDraftRepository.save(draft);

        return draft.getId();
    }

    @Override
    public void updateDraft(Long drafterEmpId, Long draftId, SalesDraftUpdateRequest req) {
        SalesDraft salesDraft = getSalesDraft(draftId, drafterEmpId);

        CommonDraftUpdateRequest commonReq = req.param();
        String editedTitle =
                (commonReq != null && commonReq.title() != null)
                        ? commonReq.title() : null;
        String editedContent =
                (commonReq != null && commonReq.content() != null)
                        ? commonReq.content() : null;

        Franchise editedFranchise = req.franchiseId() != null
                ? franchiseRepository.findById(req.franchiseId()).orElseThrow(FranchiseNotFoundException::new)
                : null;

        salesDraft.editSalesDraft(
                editedTitle,
                editedContent,
                editedFranchise,
                req.reportMonth(),
                req.salesAmount()
        );

        if (commonReq != null && commonReq.approvers() != null) {
            salesDraft.changeApprovalLine(toApproverParams(commonReq.approvers()));
        }
    }

    private SalesDraft getSalesDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof SalesDraft salesDraft)) {
            throw new DraftTypeMismatchException();
        }

        return salesDraft;
    }


    private Franchise findFranchise(SalesDraftCreateRequest req) {
        return franchiseRepository.findById(req.franchiseId())
                .orElseThrow(FranchiseNotFoundException::new);
    }
}
