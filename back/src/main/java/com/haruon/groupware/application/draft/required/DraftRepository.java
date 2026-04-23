package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.empInfo.Emp;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface DraftRepository extends Repository<Draft, Long> {
    Optional<Draft> findById(long draftId);

    Optional<Draft> findByIdAndEmp(long draftId, Emp emp);

    Optional<Draft> findBySourceKey(String sourceKey);
}
