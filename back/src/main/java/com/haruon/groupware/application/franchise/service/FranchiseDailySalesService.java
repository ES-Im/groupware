package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.franchise.provided.FranchiseDailySalesImporter;
import com.haruon.groupware.application.franchise.required.FranchiseDailySalesRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.DailySalesRequest;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseDailySales;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class FranchiseDailySalesService implements FranchiseDailySalesImporter {

    private final FranchiseRepository franchiseRepository;
    private final FranchiseDailySalesRepository franchiseDailySalesRepository;

    @Override
    public long importDailySales(long franchiseId, DailySalesRequest request) {
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new IllegalStateException("조회된 가맹점이 없음"));

        String externalId = request.externalId();
        boolean isForReplace = franchiseDailySalesRepository.existsByExternalId(externalId);

        if(isForReplace) return replaceSales(externalId, request);

        return createSales(externalId, franchise, request);
    }

    private long createSales(String externalId, Franchise franchise, DailySalesRequest request) {
        FranchiseDailySales franchiseDailySales = FranchiseDailySales.create(
                externalId,
                request.salesDate(),
                request.salesAmount(),
                request.orderCount(),
                franchise
        );

        return franchiseDailySalesRepository.save(franchiseDailySales).getId();
    }

    private long replaceSales(String externalId, DailySalesRequest request) {
        FranchiseDailySales previousSales = franchiseDailySalesRepository.findByExternalId(externalId)
                .orElseThrow(() -> new IllegalStateException("조회된 일매출 기록이 없음"));

        previousSales.replace(
                request.salesDate(),
                request.salesAmount(),
                request.orderCount()
        );

        return previousSales.getId();
    }


}
