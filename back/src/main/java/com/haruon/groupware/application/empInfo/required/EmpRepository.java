package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface EmpRepository extends Repository<Emp, Long>  {

    Optional<Emp> findById(Long id);

    Optional<Emp> findByLoginId(String loginId);

    Emp save(Emp register);

    boolean existsByLoginId(String loginId);

    boolean existsByEmpNo(String empNo);

    void deleteAll();

    Optional<Emp> findByEmpNo(String number);

    Optional<Emp> findByLoginIdAndStatus(String loginId, EmpStatus status);
}
