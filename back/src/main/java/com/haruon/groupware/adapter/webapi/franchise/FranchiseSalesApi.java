package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseSalesRetriever;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.Optional;

@RestController
@RequestMapping("/api/franchises")
@RequiredArgsConstructor
public class FranchiseSalesApi {

    private final FranchiseSalesRetriever franchiseSalesRetriever;


    @GetMapping("/{franchiseId}/sales/years/{year}")
    public ResponseEntity<FranchiseYearlySalesResponse> getFranchiseYearlySales(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @PathVariable @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        Optional<FranchiseYearlySalesResponse> response = franchiseSalesRetriever
                .retrieveFranchiseYearlySales(details.getEmpId(), franchiseId, year);

        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{franchiseId}/sales/months/{yearMonth}")
    public ResponseEntity<FranchiseMonthlySalesResponse> getFranchiseMonthlySales(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
    ) {
        Optional<FranchiseMonthlySalesResponse> response = franchiseSalesRetriever
                .retrieveFranchiseMonthlySales(details.getEmpId(), franchiseId, yearMonth);

        return response
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{franchiseId}/sales/dates/{date}")
    public ResponseEntity<FranchiseDailySalesResponse> getFranchiseDailySales(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Optional<FranchiseDailySalesResponse> response = franchiseSalesRetriever
                .retrieveFranchiseDailySales(details.getEmpId(), franchiseId, date);

        return response
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());

    }
}
