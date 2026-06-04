package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.franchise.EducationNotFoundException;
import com.haruon.groupware.application.exception.franchise.EducationRegisterMismatchException;
import com.haruon.groupware.application.exception.franchise.FranchiseNotFoundException;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;

import static com.haruon.groupware.application.utils.AuthorizationValidator.checkFranchiseRoleEmp;
import static com.haruon.groupware.application.utils.AuthorizationValidator.findActiveEmpById;

public class FranchiseUtils {

    public static Emp getFranchiseRoleAssignedEmp(EmpRepository empRepository, long empID) {
        Emp emp = findActiveEmpById(empRepository, empID);
        checkFranchiseRoleEmp(empRepository, empID);

        return emp;
    }

    public static Education findEducation(EducationRepository educationRepository, long educationId) {
        return educationRepository.findById(educationId)
                .orElseThrow(EducationNotFoundException::new);
    }

    public static void validateRegister(EmpRepository empRepository, Education education, long managerId) {
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empRepository, managerId);

        if(!education.getEmp().equals(assignedEmp))
            throw new EducationRegisterMismatchException();
    }

    static Franchise findFranchiseById(FranchiseRepository franchiseRepository, long franchiseId) {
        return franchiseRepository.findById(franchiseId)
                .orElseThrow(FranchiseNotFoundException::new);
    }
}
