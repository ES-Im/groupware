package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.domain.franchise.FranchiseDailySales;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface FranchiseDailySalesRepository extends Repository<FranchiseDailySales, Long> {

    boolean existsByExternalId(String externalId);

    Optional<FranchiseDailySales> findByExternalId(String externalId);

    FranchiseDailySales save(FranchiseDailySales franchiseDailySales);

    void deleteAll();

    Optional<FranchiseDailySales> findById(long salesId);

    long count();
}

