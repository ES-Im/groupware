package com.haruon.groupware.application.company.required;

import com.haruon.groupware.domain.Company;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface CompanyRepository extends Repository<Company, Long> {

    Company save(Company company);

    Optional<Company> findById(Long id);

    Optional<Company> findFirstByOrderByEditedAtDescIdDesc();

    long count();

    void deleteAll();
}
