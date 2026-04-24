package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface EmpLeaveRepository extends Repository<EmpLeave, Long> {

    boolean existsByEmpAndGrantYear(Emp emp, Integer grantYear);

    Optional<EmpLeave> findByEmpIdAndGrantYear(long empId, Integer grantYear);

    List<Long> findEmpIdsByGrantYear(Integer grantYear);

    EmpLeave save(EmpLeave empLeave);

    void deleteAll();

    List<EmpLeave> saveAll(Iterable<EmpLeave> empLeaves);
}
