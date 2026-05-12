package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.empInfo.Emp;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface DraftRepository extends Repository<Draft, Long> {
    Optional<Draft> findById(long draftId);

    Optional<Draft> findByIdAndEmp(long draftId, Emp emp);

    List<Draft> findBySourceKey(String sourceKey);


    List<Draft> findByEmp(Emp emp);

    void deleteAll();

    void save(Draft draft);
}

