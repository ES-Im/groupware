package com.haruon.groupware.application.employee.leave.required;

import com.haruon.groupware.domain.employee.EmpLeave;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface EmpLeaveRepository extends Repository<EmpLeave, Long> {

    Optional<EmpLeave> findByEmpIdAndGrantYear(long empId, Integer grantYear);

    EmpLeave save(EmpLeave empLeave);

    void deleteAll();

}
