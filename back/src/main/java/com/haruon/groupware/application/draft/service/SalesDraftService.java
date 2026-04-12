package com.haruon.groupware.application.draft.service;


import com.haruon.groupware.application.draft.dto.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.SalesDraftUpdateRequest;
import com.haruon.groupware.application.draft.provided.SalesDraftManagement;
import com.haruon.groupware.application.draft.required.SalesDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class SalesDraftService extends CommonDraftService implements SalesDraftManagement {

    private final EmpRepository empRepository;
    private final SalesDraftRepository salesDraftRepository;

    public SalesDraftService(EmpRepository empRepository, SalesDraftRepository salesDraftRepository) {
        super(empRepository, salesDraftRepository);
        this.salesDraftRepository = salesDraftRepository;
        this.empRepository = empRepository;
    }

    @Override
    public void createDraft(SalesDraftCreateRequest param) {

    }

    @Override
    public void createSubmitted(SalesDraftCreateRequest param) {

    }

    @Override
    public void updateDraft(SalesDraftUpdateRequest param) {

    }
}
