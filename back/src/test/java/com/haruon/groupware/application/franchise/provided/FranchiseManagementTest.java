package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.FranchiseCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.FranchiseUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.shared.Email;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@Slf4j
@TestIntegrationConfig
record FranchiseManagementTest(
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
        Emp franchiseEmp = getSavedFranchiseEmp(deptRepository, empRepository,"202601001", "franchise1");

        String businessNumber = "000-00-00000";
        String franchiseName = "테스트강남점";
        String address = "서울특별시 강남구 테스트";
        String ownerName = "홍길동";
        String contactNumber = "010-1234-5678";
        String contactEmail = "hong123@gmail.com";

        log.info("==================== create franchise 시작 ====================");
        long franchiseId = franchiseManagement.createFranchise(
                franchiseEmp.getId(),
                FranchiseCreateRequest.builder()
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
                        FranchiseCreateRequest.builder()
                                .businessNumber("000-00-00000")
                                .franchiseName("테스트강남점")
                                .address("서울특별시 강남구 테스트")
                                .ownerName("홍길동")
                                .contactNumber("010-1234-5678")
                                .contactEmail("hong123@gmail.com")
                                .build()
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원은 가맹점 정보를 수정할 수 있다.")
    void update_franchise_by_emp_who_has_franchise_role_success() {
        Emp franchiseEmp = getSavedFranchiseEmp(deptRepository, empRepository,"202601001", "franchise1");

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

        String newbusinessNumber = "100-00-00000";
        String newfranchiseName = "new테스트강남점";
        String newaddress = "new서울특별시 강남구 테스트";
        String newownerName = "new홍길동";
        String newcontactNumber = "010-1234-9999";
        String newcontactEmail = "newhong123@gmail.com";

        log.info("===================== 업데이트 시작 =====================");
        franchiseManagement.updateFranchise(
                franchiseId,
                franchiseEmp.getId(),
                FranchiseUpdateRequest.builder()
                        .businessNumber(newbusinessNumber)
                        .franchiseName(newfranchiseName)
                        .address(newaddress)
                        .ownerName(newownerName)
                        .contactNumber(newcontactNumber)
                        .contactEmail(newcontactEmail)
                .build()
        );
        log.info("===================== 업데이트 종료 =====================");
        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();

        assertThat(franchise).extracting(
                Franchise::getBusinessNumber,
                Franchise::getFranchiseName,
                Franchise::getAddress,
                Franchise::getOwnerName,
                Franchise::getContactNumber,
                Franchise::getContactEmail
        ).containsExactly(
                newbusinessNumber, newfranchiseName, newaddress, newownerName, newcontactNumber, new Email(newcontactEmail)
        );
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원은 Franchise 영업 상태 업데이트를 할 수 있다.")
    void change_business_status_by_franchise_emp() {
        Emp franchiseEmp = getSavedFranchiseEmp(deptRepository, empRepository,"202601001", "franchise1");

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

        franchiseManagement.updateFranchiseStatus(franchiseId, franchiseEmp.getId(), BusinessStatus.OPEN);

        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();
        assertThat(franchise.getBusinessStatus()).isEqualTo(BusinessStatus.OPEN);
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원은 Franchise 담당사원을 변경 할 수 있다.")
    void change_manager_by_franchise_emp() {
        Emp register = getSavedFranchiseEmp(deptRepository, empRepository,"202601001", "franchise1");
        Emp manager = getSavedFranchiseEmp(deptRepository, empRepository,"202601002", "franchise2");

        long franchiseId = franchiseManagement.createFranchise(
                register.getId(),
                FranchiseCreateRequest.builder()
                        .businessNumber("000-00-00000")
                        .franchiseName("테스트강남점")
                        .address("서울특별시 강남구 테스트")
                        .ownerName("홍길동")
                        .contactNumber("010-1234-5678")
                        .contactEmail("hong123@gmail.com")
                        .build()
        );

        franchiseManagement.updateManager(franchiseId, register.getId(), manager.getId());

        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();

        assertEquals(manager, franchise.getEmp());
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원은 Franchise 특이사항(memo)를 기록하거나 비울 수 있다")
    void update_memo_by_franchise_emp() {
        Emp register = getSavedFranchiseEmp(deptRepository, empRepository,"202601001", "franchise1");

        long franchiseId = franchiseManagement.createFranchise(
                register.getId(),
                FranchiseCreateRequest.builder()
                        .businessNumber("000-00-00000")
                        .franchiseName("테스트강남점")
                        .address("서울특별시 강남구 테스트")
                        .ownerName("홍길동")
                        .contactNumber("010-1234-5678")
                        .contactEmail("hong123@gmail.com")
                        .build()
        );

        String memo = "test";
        franchiseManagement.updateMemo(franchiseId, register.getId(), memo);

        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();

        assertEquals(franchise.getMemo(), memo);
    }

    @Test
    @DisplayName("가맹점 권한이 있는 사원은 Franchise 특이사항(memo)를 기록하거나 비울 수 있다")
    void clear_memo_by_franchise_emp() {
        Emp register = getSavedFranchiseEmp(deptRepository, empRepository, "202601001", "franchise1");

        long franchiseId = franchiseManagement.createFranchise(
                register.getId(),
                FranchiseCreateRequest.builder()
                        .businessNumber("000-00-00000")
                        .franchiseName("테스트강남점")
                        .address("서울특별시 강남구 테스트")
                        .ownerName("홍길동")
                        .contactNumber("010-1234-5678")
                        .contactEmail("hong123@gmail.com")
                        .build()
        );

        String memo = "test";
        franchiseManagement.updateMemo(franchiseId, register.getId(), memo);
        franchiseManagement.clearMemo(franchiseId, register.getId());

        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();
        assertNull(franchise.getMemo());
    }


}