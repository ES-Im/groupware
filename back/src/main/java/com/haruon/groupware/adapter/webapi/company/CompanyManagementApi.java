package com.haruon.groupware.adapter.webapi.company;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyRegisterRequest;
import com.haruon.groupware.application.company.provided.CompanyManagement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/company")
public class CompanyManagementApi {

    private final CompanyManagement companyManagement;

    @PostMapping("/new")
    public ResponseEntity<Void> register(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CompanyRegisterRequest request
    ) {
        companyManagement.registerCompany(details.getEmpId(), request);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/info")
    public ResponseEntity<Void> updateCompany(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CompanyInfoUpdateRequest request
    ) {
        companyManagement.updateCompanyInfo(details.getEmpId(), request);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/contact")
    public ResponseEntity<Void> updateContact(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CompanyContactUpdateRequest request
    ) {
        companyManagement.updatePresentedContact(details.getEmpId(), request);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/home-page-url")
    public ResponseEntity<Void> updateURL(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CompanyHomePageUpdateRequest request
    ) {
        companyManagement.updateHomePageURL(details.getEmpId(), request);

        return ResponseEntity.ok().build();
    }

}
