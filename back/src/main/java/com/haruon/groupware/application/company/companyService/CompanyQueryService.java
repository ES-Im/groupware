package com.haruon.groupware.application.company.companyService;

import com.haruon.groupware.application.company.companyService.dto.response.CompanyInfoResponse;
import com.haruon.groupware.application.company.provided.CompanyRetriever;
import com.haruon.groupware.application.company.required.CompanyRepository;
import com.haruon.groupware.application.exception.company.CompanyNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CompanyQueryService implements CompanyRetriever {

    private final CompanyRepository companyRepository;

    @Override
    public CompanyInfoResponse retrieveCompanyInfo() {
        return companyRepository.findFirstByOrderByEditedAtDescIdDesc()
                .map(CompanyInfoResponse::of)
                .orElseThrow(CompanyNotFoundException::new);
    }
}
