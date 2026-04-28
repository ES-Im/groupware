package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class FranchiseTest {

    @Test
    @DisplayName("가맹점 생성 테스트 - 담당 사원을 비워두고 만들 수 있다.")
    void createFranchise_success() {
        String businessNumber = "123456789";
        String franchiseName = "테스트강남점";
        String address = "인천광역시 부평구";
        String ownerName = "테스트";
        String contactNumber = "010-1234-5678";
        String contactEmail = "test@gmail.com";

        Franchise franchise = Franchise.create(businessNumber, franchiseName, address, ownerName, contactNumber, contactEmail, null);

        assertThat(franchise).extracting(
                Franchise::getBusinessNumber,
                Franchise::getFranchiseName,
                Franchise::getAddress,
                Franchise::getOwnerName,
                Franchise::getContactNumber,
                Franchise::getContactEmail,
                Franchise::getBusinessStatus
        ).containsExactly(
                businessNumber,
                franchiseName,
                address,
                ownerName,
                contactNumber,
                new Email(contactEmail),
                BusinessStatus.READY_TO_OPEN
        );
    }

    @Test
    @DisplayName("가맹점 정보 수정 테스트")
    void change_franchise_info_success() {
        String newBusinessNumber = "023456789";
        String newFranchiseName = "새로운강남점";
        String newAddress = "새로운 부평구";
        String newOwnerName = "새로운테스트";
        String newContactNumber = "000-1234-5678";
        String newContactEmail = "newTest@gmail.com";

        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        franchise.changeFranchiseInfo(
                newBusinessNumber, newFranchiseName, newAddress, newOwnerName, newContactNumber, newContactEmail
        );

        assertThat(franchise).extracting(
                Franchise::getBusinessNumber,
                Franchise::getFranchiseName,
                Franchise::getAddress,
                Franchise::getOwnerName,
                Franchise::getContactNumber,
                Franchise::getContactEmail
        ).containsExactly(
                newBusinessNumber,
                newFranchiseName,
                newAddress,
                newOwnerName,
                newContactNumber,
                new Email(newContactEmail)
        );

    }

    @Test
    @DisplayName("가맹점 정보 수정 테스트 - 변경할 내용이 없으면 실패")
    void change_franchise_info_without_editable_instance_fail() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        assertThatThrownBy(() ->
                franchise.changeFranchiseInfo(
                        null, null,null,null,null,null
                )
        ).hasMessage("변경할 내용이 없습니다");
    }

    @Test
    @DisplayName("가맹점 영업상태 변경 테스트")
    void change_business_status() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        franchise.changeBusinessStatus(BusinessStatus.CLOSED);

        assertEquals(BusinessStatus.CLOSED, franchise.getBusinessStatus());
    }

    @Test
    @DisplayName("가맹점 담당자 변경 테스트")
    void change_assigned_emp() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        Emp approvedEmp = getApprovedEmp();
        approvedEmp.getSystemRoles().add(SystemRoleCode.FRANCHISE);

        franchise.changeManager(approvedEmp);

        assertEquals(franchise.getEmp(), approvedEmp);
    }

    @Test
    @DisplayName("가맹점 담당자 변경 테스트 - 가맹점 권한이 없거나 활성화 사원이 아니라면 변경 실패")
    void change_assigned_emp_fail() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        Emp approvedEmp = getApprovedEmp();
        assertThatThrownBy(() ->
                franchise.changeManager(approvedEmp)
        ).hasMessage("가맹점 권한이 없음");

        approvedEmp.getSystemRoles().add(SystemRoleCode.FRANCHISE);
        approvedEmp.changeResignedEmpInfoByAdmin(LocalDate.of(2026, 5, 1));

        assertThatThrownBy(() ->
                franchise.changeManager(approvedEmp)
        ).hasMessage("활성화된 사원이 아님");
    }
    
    @Test
    @DisplayName("가맹점 특이사항 메모 테스트")
    void addMemo_at_franchise_info_success() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        String memo = "test";
        franchise.changeMemo(memo);

        assertEquals(memo, franchise.getMemo());
    }

    @Test
    @DisplayName("가맹점 특이사항 메모 삭제 테스트")
    void clear_Memo_at_franchise_info_success() {
        Franchise franchise = Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);

        String memo = "test";
        franchise.changeMemo(memo);

        franchise.clearMemo();

        assertNull(franchise.getMemo());

    }


}