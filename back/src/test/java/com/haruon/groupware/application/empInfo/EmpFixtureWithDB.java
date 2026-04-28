package com.haruon.groupware.application.empInfo;

import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.DeptFixture;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.EmpFixture.*;

/**
 * saveAdmin - 어드민 사원
 * saveRegisteredEmp - 막 회원가입한 사원
 * saveApprovedEmp - 회원가입 승인난 사원
 * saveEmpWithSystemRole - 시스템 롤을 지정한 사원
 */
public class EmpFixtureWithDB {

    /**
     * saveAdmin - 어드민 사원
     */
    public static Emp saveAdmin(EmpRepository empRepository) {
        System.out.println("===== 테스트 준비 saveAdmin 시작 =====");
        Emp emp = getAdmin();

        return empRepository.save(emp);
    }


    /**
     * saveRegisteredEmp - 막 회원가입한 사원
     */
    public static Emp saveRegisteredEmp(EmpRepository empRepository) {
        System.out.println("===== 테스트 준비 register Emp 시작 =====");
        Emp emp = getRegisteredEmp("202601001", "registeredEmp1");

        return empRepository.save(emp);
    }


    /**
     * saveApprovedEmp - 회원가입 승인난 사원
     */
    public static Emp saveApprovedEmp(EmpRepository empRepository) {
        System.out.println("===== 테스트 준비 approve Emp 시작 =====");
        Emp emp = getApprovedEmpWithoutDept("202601002", "approvedEmp2");

        return empRepository.save(emp);
    }

    public static Emp saveApprovedEmp(EmpRepository empRepository, String empNo, String empId) {
        System.out.println("===== 테스트 준비 approve Emp 시작 =====");
        Emp emp = getApprovedEmpWithoutDept(empNo, empId);

        return empRepository.save(emp);
    }


    /**
     * saveEmpWithDept - 부서를 지정한 사원
     */
    public static Emp saveEmpWithDept(EmpRepository empRepository,
                                      DeptRepository deptRepository,
                                      String empNo, String empId,
                                      Dept dept) {
        System.out.println("===== 테스트 준비 saveEmpWithDept 시작 =====");
        Emp emp = saveEmpWithRoleAndDept(empRepository, deptRepository, empNo, empId, dept, SystemRoleCode.EMPLOYEE);

        return empRepository.save(emp);
    }

    /**
     * saveEmpWithRoleAndDept - 부서 & 시스템 롤을 지정한 사원
     */
    public static Emp saveEmpWithRoleAndDept(EmpRepository empRepository,
                                      DeptRepository deptRepository,
                                      String empNo, String empId,
                                      Dept dept,
                                      SystemRoleCode systemRoleCode) {
        System.out.println("===== 테스트 준비 saveEmpWithRoleAndDept 시작 =====");
        Emp emp = getApprovedEmpWithoutDept(empNo, empId);
        setDept(emp, dept, deptRepository, systemRoleCode);

        return empRepository.save(emp);
    }









    private static void setDept(
            Emp emp, Dept dept,  DeptRepository deptRepository,
            SystemRoleCode systemRoleCode
    ) {

        deptRepository.save(dept);
        emp.changeBelongingsByAdmin(
                dept,
                PositionCode.STAFF,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );

        emp.changeInfoByAdmin(
                null, null,
                null, null,
                null, null,
                systemRoleCode,
                null, null
        );
    }

    public static Dept saveDept(DeptRepository deptRepository, String deptName, String deptNo) {
        System.out.println("===== 테스트 준비 save dept =====");
        Dept dept = DeptFixture.getDept(deptNo, deptName);
        return deptRepository.save(dept);
    }



}
