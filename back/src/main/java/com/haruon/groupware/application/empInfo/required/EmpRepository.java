package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Emp;
import org.springframework.data.repository.Repository;

import java.util.Optional;

/**
 * 사원조회
 */

public interface EmpRepository extends Repository<Emp, Long>  {

    Optional<Emp> findById(Long id);
}
