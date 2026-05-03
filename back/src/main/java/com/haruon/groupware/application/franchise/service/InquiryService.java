package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.franchise.provided.InquiryImporter;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.InquiryRequest;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.FranchiseUtils.findFranchiseById;

@Service
@Transactional
@RequiredArgsConstructor
public class InquiryService implements InquiryImporter {

    private final FranchiseRepository franchiseRepository;
    private final FranchiseInquiryRepository franchiseInquiryRepository;

    @Override
    public long importInquiry(long franchiseId, InquiryRequest request) {
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        String externalId = request.externalId();
        boolean isForReplace = franchiseInquiryRepository.existsByExternalId(externalId);

        if(isForReplace) return replaceInquiry(request);

        return createInquiry(franchise, request);
    }


    private long createInquiry(Franchise franchise, InquiryRequest request) {
        FranchiseInquiry inquiry = FranchiseInquiry.createInquiry(
                request.externalId(),
                franchise,
                request.inquirerContact(),
                request.inquiryAt(),
                request.inquiryTitle(),
                request.inquiryContent()
        );

        return franchiseInquiryRepository.save(inquiry).getId();
    }

    private long replaceInquiry(InquiryRequest request) {
        FranchiseInquiry previousInquiry = franchiseInquiryRepository.findByExternalId(request.externalId())
                .orElseThrow(() -> new IllegalStateException("조회된 질의가 없음"));    // to-do 커스텀 예외처리 필요

        previousInquiry.replaceInquiry(
                request.inquirerContact(),
                request.inquiryAt(),
                request.inquiryTitle(),
                request.inquiryContent()
        );

        return previousInquiry.getId();
    }
}
