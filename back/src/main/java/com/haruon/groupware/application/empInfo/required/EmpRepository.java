package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Emp;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface EmpRepository extends Repository<Emp, Long>  {

    Optional<Emp> findById(Long id);

    Emp save(Emp register);

    boolean existsByLoginId(String loginId);

    boolean existsByEmpNo(String empNo);

    void deleteAll();

    Optional<Emp> findByEmpNo(String number);
}
