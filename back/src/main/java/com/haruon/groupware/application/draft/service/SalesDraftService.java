package com.haruon.groupware.application.draft.service;


import com.haruon.groupware.application.draft.provided.SalesDraftManagement;
import com.haruon.groupware.application.draft.required.SalesDraftRepository;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.CommonDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.dto.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.service.dto.SalesDraftUpdateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.SalesDraft;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
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
            FranchiseRepository franchiseRepository
    ) {
        super(empRepository, salesDraftRepository);
        this.salesDraftRepository = salesDraftRepository;
        this.franchiseRepository = franchiseRepository;
    }

    @Override
    public void createDraft(SalesDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = toApproverParams(commonReq.approvers());
        Franchise franchise = franchiseRepository.findById(req.franchiseId())
                .orElseThrow(() -> new IllegalArgumentException("가맹점을 찾을 수 없습니다."));

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
    }

    @Override
    public void createSubmitted(SalesDraftCreateRequest req) {
        CommonDraftCreateRequest commonReq = req.param();
        Emp drafter = findActiveEmpById(commonReq.empId());
        List<ApproversParam> approvers = requireApprovers(commonReq.approvers());
        LocalDateTime submittedAt = requireSubmittedAt(commonReq.submittedAt());
        Franchise franchise = franchiseRepository.findById(req.franchiseId())
                .orElseThrow(() -> new IllegalArgumentException("가맹점을 찾을 수 없습니다."));

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
    }

    @Override
    public void updateDraft(SalesDraftUpdateRequest req) {
        CommonDraftUpdateRequest commonReq = req.param();
        SalesDraft salesDraft = getSalesDraft(commonReq.draftId(), commonReq.drafterId());

        salesDraft.editSalesDraft(
                commonReq.title(),
                commonReq.content(),
                req.reportMonth(),
                req.salesAmount()
        );
    }

    private SalesDraft getSalesDraft(long draftId, long drafterId) {
        Draft draft = findDraftByDraftIdAndEmpId(draftId, drafterId);

        if(!(draft instanceof SalesDraft salesDraft)) {
            throw new IllegalArgumentException("일반기안서가 아님");
        }

        return salesDraft;
    }
}
