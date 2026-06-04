package com.haruon.groupware.adapter.webapi.company;

import com.haruon.groupware.application.company.companyService.dto.response.CompanyInfoResponse;
import com.haruon.groupware.application.company.provided.CompanyRetriever;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/company")
public class CompanyApi {

    private final CompanyRetriever companyRetriever;

    @GetMapping
    public ResponseEntity<CompanyInfoResponse> getCompany() {
        CompanyInfoResponse companyInfoResponse
                = companyRetriever.retrieveCompanyInfo();

        return ResponseEntity.ok().body(companyInfoResponse);
    }


}
