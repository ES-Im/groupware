package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.franchise.EducationNotFoundException;
import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;

import static com.haruon.groupware.application.utils.AuthorizationChecker.checkFranchiseRoleEmp;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
//todo - 커스텀 예외처리 필요
public class FranchiseUtils {

    static Emp getFranchiseRoleAssignedEmp(EmpRepository empRepository, long empID) {
        Emp emp = findActiveEmpById(empRepository, empID);
        checkFranchiseRoleEmp(empRepository, empID);

        return emp;
    }

    static Franchise findFranchiseById(FranchiseRepository franchiseRepository, long franchiseId) {
        return franchiseRepository.findById(franchiseId)
                .orElseThrow(FranchiseNotFoundException::new);
    }


    static Education findEducation(EducationRepository educationRepository, long educationId) {
        return educationRepository.findById(educationId)
                .orElseThrow(EducationNotFoundException::new);
    }


}
