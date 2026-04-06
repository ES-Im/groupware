package com.haruon.groupware.application.empInfo.required;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpLeave;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface LeaveRepository extends Repository<EmpLeave, Long> {

    boolean existsByEmpAndGrantYear(Emp emp, Integer grantYear);

    Optional<EmpLeave> findByEmpIdAndGrantYear(long empId, Integer grantYear);

}
