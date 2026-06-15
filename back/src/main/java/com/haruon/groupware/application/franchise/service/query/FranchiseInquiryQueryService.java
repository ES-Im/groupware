package com.haruon.groupware.application.franchise.service.query;

import com.haruon.groupware.application.exception.franchise.InquiryNotFoundException;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseInquiryRetriever;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class FranchiseInquiryQueryService implements FranchiseInquiryRetriever {

    private final FranchiseInquiryQueryRepository franchiseInquiryQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public Page<InquiriesResponse> retrieveInquiries(
            Long empId,
            @Nullable Boolean isAnswered,
            @Nullable Long assignedManagerId,
            @Nullable String keyword,
            @Nullable LocalDate from,
            @Nullable LocalDate to,
            Pageable pageable
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseInquiryQueryRepository.findInquiries(
                isAnswered, assignedManagerId, keyword, from, to, pageable
        );
    }

    @Override
    public InquireDetailResponse retrieveInquiry(Long empId, Long inquiryId) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseInquiryQueryRepository.findInquiryById(inquiryId)
                .orElseThrow(InquiryNotFoundException::new);
    }

    @Override
    public Optional<AnswerResponse> retrieveAnswer(Long empId, Long inquiryId) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseInquiryQueryRepository.findAnswerByInquiryId(inquiryId);
    }
}
