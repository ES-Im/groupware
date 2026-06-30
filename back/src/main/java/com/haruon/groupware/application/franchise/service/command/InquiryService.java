package com.haruon.groupware.application.franchise.service.command;

import com.haruon.groupware.application.exception.franchise.FranchiseInquiryNotFoundException;
import com.haruon.groupware.application.exception.franchise.InquiryNotFoundException;
import com.haruon.groupware.application.exception.franchise.UnsupportedInquiryTypeException;
import com.haruon.groupware.application.franchise.provided.forImport.InquiryImporter;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import com.haruon.groupware.domain.franchise.InquiryType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.support.FranchiseUtils.findFranchiseById;

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

        switch (request.type()) {
            case NEW -> {
                return createInquiry(franchise, request);
            }

            case EDIT -> {
                FranchiseInquiry inquiry = franchiseInquiryRepository.findByExternalId(externalId)
                        .orElseThrow(InquiryNotFoundException::new);

                inquiry.changeInquiryStatus(InquiryType.EDIT);
                return replaceInquiry(request);
            }

            case DELETION -> {
                FranchiseInquiry inquiry = franchiseInquiryRepository.findByExternalId(externalId)
                        .orElseThrow(InquiryNotFoundException::new);

                inquiry.changeInquiryStatus(InquiryType.DELETION);
                return inquiry.getId();
            }

            default -> throw new UnsupportedInquiryTypeException();
        }
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
                .orElseThrow(FranchiseInquiryNotFoundException::new);

        previousInquiry.replaceInquiry(
                request.inquirerContact(),
                request.inquiryAt(),
                request.inquiryTitle(),
                request.inquiryContent()
        );

        return previousInquiry.getId();
    }
}
