package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.FranchiseManagement;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.shared.Email;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.saveApprovedEmp;
import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.saveEmpWithRoleAndDept;
import static com.haruon.groupware.application.franchise.service.dto.FranchiseCreateRequest.builder;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Slf4j
@TestIntegrationConfig
record FranchiseServiceTest(
        FranchiseManagement franchiseManagement,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository
) {
    @AfterEach
    void tearDown() {
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("프랜차이즈 권한이 있는 사원은 가맹점을 신규 등록할 수 있다")
    void create_franchise_by_emp_who_has_franchise_role_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");

        String businessNumber = "000-00-00000";
        String franchiseName = "테스트강남점";
        String address = "서울특별시 강남구 테스트";
        String ownerName = "홍길동";
        String contactNumber = "010-1234-5678";
        String contactEmail = "hong123@gmail.com";

        log.info("==================== create franchise 시작 ====================");
        long franchiseId = franchiseManagement.createFranchise(
                franchiseEmp.getId(),
                builder()
                        .businessNumber(businessNumber)
                        .franchiseName(franchiseName)
                        .address(address)
                        .ownerName(ownerName)
                        .contactNumber(contactNumber)
                        .contactEmail(contactEmail)
                        .managerEmpId(franchiseEmp.getId())
                        .build()
        );
        log.info("==================== create franchise 종료 ====================");


        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();
        assertThat(franchise).extracting(
                Franchise::getBusinessNumber,
                Franchise::getFranchiseName,
                Franchise::getAddress,
                Franchise::getOwnerName,
                Franchise::getContactNumber,
                Franchise::getContactEmail,
                Franchise::getEmp
        ).containsExactly(
                businessNumber, franchiseName, address, ownerName, contactNumber, new Email(contactEmail), franchiseEmp
        );
    }

    @Test
    @DisplayName("프랜차이즈 권한이 없는 사원은 가맹점을 신규 등록할 수 없다")
    void create_franchise_by_emp_who_has_not_franchise_role_fail() {
        Emp franchiseEmp = saveApprovedEmp(empRepository, "202601001", "normalEmp");

        assertThatThrownBy(() ->
                franchiseManagement.createFranchise(
                        franchiseEmp.getId(),
                        builder()
                                .businessNumber("000-00-00000")
                                .franchiseName("테스트강남점")
                                .address("서울특별시 강남구 테스트")
                                .ownerName("홍길동")
                                .contactNumber("010-1234-5678")
                                .contactEmail("hong123@gmail.com")
                                .build()
                )
        ).hasMessage("권한이 없습니다.");
    }

//    @Test
//    @DisplayName("가맹점 권한이 있는 사원은 가맹점 ")
//    void () {
//        // given
//
//        // when
//
//        // then
//    }





    private Emp getFranchiseEmp(String empNo, String loginId) {
        Dept franchise = deptRepository.save(Dept.registerDept("00001", "Franchise"));

        return saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                empNo, loginId, franchise,
                SystemRoleCode.FRANCHISE
        );
    }
}