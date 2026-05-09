package com.haruon.groupware.application.dbFixture;

import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.FranchiseManagement;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.FranchiseCreateRequest;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Franchise;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveEmpWithRoleAndDept;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;

public class FranchiseFixture {

    /**
     * 가맹점 권한이 있는 사원(부서 + 사원 save)
     */
    public static Emp getSavedFranchiseEmp(
            DeptRepository deptRepository,
            EmpRepository empRepository,
            String empNo,
            String loginId
    ) {
        Dept franchise = deptRepository.findByDeptCode("00001")
                .orElseGet(() -> deptRepository.save(
                        Dept.registerDept("00001", "Franchise")
                ));

        return empRepository.findByEmpNo(empNo).orElseGet(() ->
            saveEmpWithRoleAndDept(
                    empRepository,
                    deptRepository,
                    empNo, loginId, franchise,
                    SystemRoleCode.FRANCHISE
            )
        );
    }

    /**
     * 가맹점 권한이 있는 사원(사원 save)
     */
    public static Emp getSavedFranchiseEmp(
            EmpRepository empRepository,
            Dept dept,
            String empNo,
            String loginId
    ) {
        Emp approvedEmp = getApprovedEmp(empNo, loginId);

        approvedEmp.getSystemRoles().add(
                SystemRoleCode.FRANCHISE
        );

        approvedEmp.changeBelongingsByHR(
                dept, null, true, null, null
        );

        return empRepository.save(approvedEmp);
    }


    /**
     * 가맹점 (dept save)
     */
    public static Franchise getSavedFranchise(
            DeptRepository deptRepository,
            EmpRepository empRepository,
            FranchiseRepository franchiseRepository,
            FranchiseManagement franchiseManagement
    ) {

        Emp franchiseEmp = getSavedFranchiseEmp(deptRepository, empRepository,"202601000", "franchise1111");

        long franchiseId = franchiseManagement.createFranchise(
                franchiseEmp.getId(),
                FranchiseCreateRequest.builder()
                        .businessNumber("000-00-00000")
                        .franchiseName("테스트강남점")
                        .address("서울특별시 강남구 테스트")
                        .ownerName("홍길동")
                        .contactNumber("010-1234-5678")
                        .contactEmail("hong123@gmail.com")
                        .build()
        );

        return franchiseRepository.findById(franchiseId).orElseThrow();
    }


}
