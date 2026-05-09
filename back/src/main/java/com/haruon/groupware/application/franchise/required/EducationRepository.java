package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.domain.franchise.Education;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface EducationRepository extends Repository<Education, Long> {

    Education save(Education education);

    Optional<Education> findById(long educationId);

    void deleteAll();
}
