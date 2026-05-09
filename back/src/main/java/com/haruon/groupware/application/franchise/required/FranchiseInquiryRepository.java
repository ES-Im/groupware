package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface FranchiseInquiryRepository extends Repository<FranchiseInquiry, Long> {
    Optional<FranchiseInquiry> findByExternalId(String externalId);

    Optional<FranchiseInquiry> findById(long inquiryId);

    FranchiseInquiry save(FranchiseInquiry inquiry);

    boolean existsByExternalId(String externalId);

    long count();

    void deleteAll();

}
