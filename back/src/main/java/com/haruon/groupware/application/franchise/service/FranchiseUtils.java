package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.requried.EducationRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;

import static com.haruon.groupware.application.utils.Utils.findActiveEmpById;

public class FranchiseUtils {

    static Emp getFranchiseRoleAssignedEmp(EmpRepository empRepository, long empID) {
        Emp emp = findActiveEmpById(empRepository, empID);
        isFranchiseRoleAssignedEmp(empRepository, empID);

        return emp;
    }

    static void isFranchiseRoleAssignedEmp(EmpRepository  empRepository, long empId) {
        Emp emp = findActiveEmpById(empRepository, empId);
        boolean isFranchiseRoleAssigned = emp.getSystemRoles().contains(SystemRoleCode.FRANCHISE);

        if(!isFranchiseRoleAssigned) {
            throw new IllegalArgumentException("권한이 없습니다.");    // to-do 커스텀 예외처리 필요
        }
    }

    static Franchise findFranchiseById(FranchiseRepository franchiseRepository, long franchiseId) {
        return franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new IllegalStateException("조회된 가맹점 정보가 없음")); // to-do 커스텀 예외 처리 필요
    }


    static Education findEducation(EducationRepository educationRepository, long educationId) {
        return educationRepository.findById(educationId)
                .orElseThrow(() -> new IllegalStateException("조회된 교육정보가 없음"));  // to-do 커스텀 예외처리
    }


}
