package com.haruon.groupware.adapter;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpPasswordEncoder;
import com.haruon.groupware.domain.shared.Email;

import java.time.LocalDate;

public class IntegrityTestFixtures {


    public static void registerAndApproveEmp(
            EmpRepository empRepository,
            EmpPasswordEncoder encoder,
            String loginId, String password
    ) {
        Email newEmail = Email.of(loginId, "haruon.com");
        Emp test = Emp.register("202601999", "Test", loginId, password, newEmail, encoder);
        test.approveRegister(LocalDate.of(2026,1,1));
        empRepository.save(test);
    }

}
