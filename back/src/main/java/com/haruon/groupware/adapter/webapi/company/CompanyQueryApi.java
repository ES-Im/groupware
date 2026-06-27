package com.haruon.groupware.adapter.webapi.company;

import com.haruon.groupware.application.company.provided.forRetriever.CompanyRetriever;
import com.haruon.groupware.application.company.service.query.dto.CompanyInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/companies")
public class CompanyQueryApi {

    private final CompanyRetriever companyRetriever;

    @GetMapping
    public ResponseEntity<CompanyInfoResponse> getCompany() {
        CompanyInfoResponse companyInfoResponse
                = companyRetriever.retrieveCompanyInfo();

        return ResponseEntity.ok().body(companyInfoResponse);
    }


}
