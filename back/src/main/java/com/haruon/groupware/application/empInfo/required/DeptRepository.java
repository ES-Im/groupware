package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Dept;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface DeptRepository extends Repository<Dept, Long> {

    Optional<Dept> findById(Long id);

    Dept save(Dept dept);

    Optional<Dept> findByDeptCode(String deptCode);

    void deleteAll();

}
