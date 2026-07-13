package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Optional;

public interface FranchiseInquiryQueryRepository {

    Page<InquiriesResponse> findInquiries(
            @Nullable Boolean isAnswered,
            @Nullable Long assignedManagerId,
            @Nullable String keyword,
            @Nullable LocalDate from,
            @Nullable LocalDate to,
            @Nullable Long franchiseId,
            Pageable pageable);

    Optional<InquireDetailResponse> findInquiryById(Long inquiryId);

    Optional<AnswerResponse> findAnswerByInquiryId(Long inquiryId);
}
