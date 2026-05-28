package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import com.haruon.groupware.domain.empInfo.EmpFile;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.Email;
import com.haruon.groupware.domain.shared.EmpFixture;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.shared.DeptFixture.getDept;
import static com.haruon.groupware.domain.shared.EmpFixture.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmpTest {

    String currentPassword = "!1currentPassword";

    @Test
    @DisplayName("사원 가입 테스트")
    void register_success() {
        Emp pendingEmp = EmpFixture.getRegisteredEmp();
        
        assertThat(pendingEmp.getStatus()).isEqualTo(EmpStatus.PENDING);
        assertThat(pendingEmp.getEmpNo()).isNotNull();
        assertThat(pendingEmp.getLoginId()).isNotNull();
        assertThat(pendingEmp.getEmpName()).isNotNull();
        assertThat(pendingEmp.getEmpPassword()).isNotNull();
    }

    @Test
    @DisplayName("가입 승인 성공 테스트")
    void approveRegister_success() {
        Emp activeEmp = EmpFixture
                .getRegisteredEmp();
        LocalDate date = LocalDate.of(2026,1,1);

        activeEmp.approveRegister(date);

        assertThat(activeEmp.getStatus()).isEqualTo(EmpStatus.ACTIVE);
        assertThat(activeEmp.getSystemRoles()).containsExactly(SystemRoleCode.EMPLOYEE);
        assertThat(activeEmp.getHiredAt()).isEqualTo(date);
    }

    @Test
    @DisplayName("가입 승인 실패 테스트: PENDING상태 외에는 가입 승인이 되지 않는다.")
    void approveRegister_fail() {
        Emp activeEmp = EmpFixture.getRegisteredEmp();
        LocalDate date = LocalDate.of(2026,1,1);

        ReflectionTestUtils.setField(activeEmp, "status", EmpStatus.SUSPENDED);

        assertThatThrownBy(() ->
                activeEmp.approveRegister(date)
        ).isInstanceOf(IllegalStateException.class);
    }
    
    @Test
    @DisplayName("파일 삭제 테스트")
    void removeFile_success() {
        Emp approvedEmp = EmpFixture.getApprovedEmp();
        EmpFile addedFile = addFileWithType(approvedEmp, FileType.PROFILE_PICTURE);
        ReflectionTestUtils.setField(addedFile, "id", 1L);

        approvedEmp.removeFile(addedFile.getId());

        assertThat(approvedEmp.getEmpFiles().size()).isEqualTo(0);
        assertThat(approvedEmp.getEmpFiles()).doesNotContain(addedFile);
    }

    @Test
    @DisplayName("시스템 총괄은 퇴직한 사원 정보를 비활성화 할 수 있다.")
    void change_ResignedEmpInfo_ByAdmin_success() {
        LocalDate resignedAt = LocalDate.of(2026, 2, 1);
        Emp resignedEmp = getApprovedEmp();
        addBelongings(resignedEmp);

        resignedEmp.changeResignedEmpInfoByHR(resignedAt);

        assertThat(resignedEmp.getResignedAt()).isEqualTo(resignedAt);
        assertThat(resignedEmp.getStatus()).isEqualTo(EmpStatus.RESIGNED);
        assertThat(resignedEmp.getEmpBelongings().stream()
                .filter(EmpBelongings::isPrimary))
                .hasSize(0);
    }

    @Test
    @DisplayName("본인은 내선번호를 변경할 수 있다")
    void change_Extension_BySelf_success() {
        Emp emp = getApprovedEmp();

        emp.changeInfoBySelf(
                "123-4567",
                null,
                encoder);

        assertThat(emp.getExtensionNo()).isEqualTo("123-4567");
    }

    @Test
    @DisplayName("본인은 비밀번호를 변경할 수 있다")
    void change_Password_BySelf_success() {
        Emp emp = getApprovedEmp();
        String oldPassword = emp.getEmpPassword();

        emp.changeInfoBySelf(
                null,
                "!Qw123456",
                encoder);

        assertThat(emp.getEmpPassword()).isNotEqualTo(oldPassword);
    }

    @Test
    @DisplayName("본인의 이미지파일을 등록할 수 있다.")
    void add_emp_file_by_Self_success() {
        Emp emp = getApprovedEmp();

        emp.changeEmpFile(
                FileType.PROFILE_PICTURE,
                "image/png",
                "원본",
                "stored.png",
                "png",
                (1024L * 1024),
                "/test/stored.png"
        );

        assertThat(emp.getEmpFiles()).hasSize(1);
        assertThat(emp.getEmpFiles().getFirst().getFileType()).isEqualTo(FileType.PROFILE_PICTURE);
        assertThat(emp.getEmpFiles().getFirst().isActive()).isTrue();
    }

    @Test
    @DisplayName("같은 타입의 이미지를 등록한다면 같은 타입 중 다른 파일이 비활성화 된다.")
    void add_emp_file_by_Self_success_and_deactivate_same_type_others() {
        Emp emp = getApprovedEmp();

        addFileWithType(emp, FileType.PROFILE_PICTURE);
        addFileWithType(emp, FileType.PROFILE_PICTURE);

        assertThat(emp.getEmpFiles()).hasSize(2);
        assertThat(emp.getEmpFiles().stream().filter(EmpFile::isActive)).hasSize(1);
    }

    @Test
    @DisplayName("부서시스템담당자는 직원의 시스템권한을 변경할 수 있다")
    void change_SystemRole_ByDeptManager_success() {
        Emp emp = getApprovedEmp();

        emp.changeInfoByDeptManager(
                null, Set.of(SystemRoleCode.DEPT_MANAGER)
        );
    }

    @Test
    @DisplayName("부서시스템담당자는 부서시스템이상의 시스템권한을 부여할 수 없다")
    void change_SystemRole_ByDeptManager_fail() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                emp.changeInfoByDeptManager(
                        null, Set.of(SystemRoleCode.ADMIN)
                )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("부서시스템담당자는 직원의 내선번호를 수정할 수 있다.")
    void change_extensionNo_ByDeptManager_fail() {
        Emp emp = getApprovedEmp();

        emp.changeInfoByDeptManager(
                "111-1111", null
        );
    }

    private static Stream<Arguments> empUpdateByAdminParams() {
        return Stream.of(
                Arguments.of("이름을 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .empName("EditedName")
                        .build()),

                Arguments.of("비밀번호를 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .newRawPassword(")p9o8i7u6y")
                        .build()),

                Arguments.of("내선번호를 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .extensionNo("999-9999")
                        .build()),

                Arguments.of("입사일자를 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .hireAt(LocalDate.of(2025, 1, 1))
                        .build()),

                Arguments.of("직무상태를 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .empStatus(EmpStatus.SUSPENDED)
                        .build()),

                Arguments.of("시스템 권한을 변경할 수 있다.", EmpAdminUpdateTestParam.builder()
                        .companyDomain("@haruon.com")
                        .systemRoleCode(Set.of(SystemRoleCode.ADMIN, SystemRoleCode.HR))
                        .build())
        );
    }

    @ParameterizedTest(name = "{index} => 시스템총괄(ADMIN)은 {0}")
    @DisplayName("시스템 총괄 사원 기본정보 변경 성공 테스트")
    @MethodSource("empUpdateByAdminParams")
    void change_basic_empInfo_ByAdmin(String description, EmpAdminUpdateTestParam params) {
        // given
        Emp emp = getApprovedEmp();

        String beforeEmpName = emp.getEmpName();
        String beforeEmpId = emp.getLoginId();
        Email beforeEmail = emp.getEmail();
        String beforeExtensionNo = emp.getExtensionNo();
        EmpStatus beforeEmpStatus = emp.getStatus();
        Set<SystemRoleCode> beforeSystemRoleCode = emp.getSystemRoles();
        LocalDate beforeHiredAt = emp.getHiredAt();
        String beforePassword = emp.getEmpPassword();

        // when
        emp.changeInfoByHR(
                params.empName(),
                params.newRawPassword(),
                params.extensionNo(),
                params.empStatus(),
                params.systemRoleCode(),
                params.hireAt(),
                encoder
        );

        // then
        if (params.empName() != null) {
            assertThat(emp.getEmpName()).isEqualTo(params.empName());
        } else {
            assertThat(emp.getEmpName()).isEqualTo(beforeEmpName);
        }

        if (params.empId() != null) {
            assertThat(emp.getLoginId()).isEqualTo(params.empId());
            assertThat(emp.getEmail().email()).isEqualTo(params.empId() + "@" + params.companyDomain());
        } else {
            assertThat(emp.getLoginId()).isEqualTo(beforeEmpId);
            assertThat(emp.getEmail()).isEqualTo(beforeEmail);
        }

        if (params.newRawPassword() != null) {
            assertThat(encoder.matches(params.newRawPassword(), emp.getEmpPassword())).isTrue();
        } else {
            assertThat(emp.getEmpPassword()).isEqualTo(beforePassword);
        }

        if (params.extensionNo() != null) {
            assertThat(emp.getExtensionNo()).isEqualTo(params.extensionNo());
        } else {
            assertThat(emp.getExtensionNo()).isEqualTo(beforeExtensionNo);
        }

        if (params.empStatus() != null) {
            assertThat(emp.getStatus()).isEqualTo(params.empStatus());
        } else {
            assertThat(emp.getStatus()).isEqualTo(beforeEmpStatus);
        }

        if (params.systemRoleCode() != null) {
            assertThat(emp.getSystemRoles()).isEqualTo(params.systemRoleCode());
        } else {
            assertThat(emp.getSystemRoles()).isEqualTo(beforeSystemRoleCode);
        }

        if (params.hireAt() != null) {
            assertThat(emp.getHiredAt()).isEqualTo(params.hireAt());
        } else {
            assertThat(emp.getHiredAt()).isEqualTo(beforeHiredAt);
        }
    }

    private Email createEmail(String empId, String companyDomain) {
        if (empId == null || companyDomain == null) {
            return null;
        }
        return new Email(empId + "@" +  companyDomain);
    }

    @Builder
    private record EmpAdminUpdateTestParam(
            String empName,
            String empId,
            String newRawPassword,
            String extensionNo,
            EmpStatus empStatus,
            Set<SystemRoleCode> systemRoleCode,
            LocalDate hireAt,
            String companyDomain
    ) {}

    @Test
    @DisplayName("파일을 비활성화 성공 테스트")
    void deactivate_emp_file_by_admin() {
        Emp emp = getApprovedEmp();
        EmpFile file = addFileWithType(emp, FileType.PROFILE_PICTURE);
        ReflectionTestUtils.setField(file, "id", 1L);

        emp.changeFileActiveStatus(1L, false);

        assertThat(file.isActive()).isFalse();
    }

    @Test
    @DisplayName("같은 타입 파일을 활성화하면 기존 활성 파일은 비활성화된다")
    void activate_emp_file_by_admin_and_deactivate_same_type_others() {
        Emp emp = getApprovedEmp();
        EmpFile file1 = addFileWithType(emp, FileType.PROFILE_PICTURE);
        EmpFile file2 = addFileWithType(emp, FileType.PROFILE_PICTURE);

        ReflectionTestUtils.setField(file1, "id", 1L);
        assertThat(file1.isActive()).isFalse();  // deactivated when file2 added

        ReflectionTestUtils.setField(file2, "id", 2L);
        assertThat(file2.isActive()).isTrue();

        emp.changeFileActiveStatus(1L, true);

        assertThat(file1.isActive()).isTrue();
        assertThat(file2.isActive()).isFalse();
    }

    @Test
    @DisplayName("사원의 소속정보를 등록 성공테스트")
    void add_emp_belongs_ByAdmin() {
        Emp emp = getApprovedEmp();
        Dept dept = getDept();

        emp.changeBelongingsByHR(
                dept,
                PositionCode.STAFF,
                true,
                LocalDate.of(2026, 1, 1),
                null
        );

        assertThat(emp.getEmpBelongings())
                .singleElement()
                .satisfies(belongings -> {
                    assertThat(belongings.getDept()).isNotNull();
                    assertThat(belongings.getPosition()).isEqualTo(PositionCode.STAFF);
                    assertThat(belongings.isPrimary()).isEqualTo(true);
                    assertThat(belongings.getStartAt()).isEqualTo(LocalDate.of(2026, 1, 1));
                    assertThat(belongings.getEndAt()).isNull();
                });
    }

    @Test
    @DisplayName("시스템 총괄은 사원의 소속정보를 수정할 수 있다.")
    void change_emp_belongs_ByAdmin() {
        Emp emp = getApprovedEmp();

        addBelongings(emp);

        emp.changeBelongingsByHR(
                null,
                null,
                false,
                null,
                null
        );

        assertThat(emp.getEmpBelongings()).singleElement()
                .satisfies(e -> assertThat(e.isPrimary()).isFalse());
    }
    // 부서를 바꿀수있다
    // 주요소속정보를 바꿀 수 있으며, 다른 소속정보 중 주요소속정보가 있으면 비활성화
    // 시작일자
    // 종료일자 변경
    private static Stream<Arguments> UpdateBelongingTestParams() {
        return Stream.of(
                Arguments.of( "직급",
                        UpdateBelongingTestParam.builder()
                                .position(PositionCode.STAFF)
                        .build()
                ),Arguments.of( "시작일자",
                        UpdateBelongingTestParam.builder()
                                .startAt(LocalDate.of(2026, 4, 1))
                        .build()
                ),Arguments.of( "종료일자",
                        UpdateBelongingTestParam.builder()
                                .startAt(LocalDate.of(2026, 4, 1))
                                .endAt(LocalDate.of(2026,12,31))
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> 사원의 소속정보 중 {0}을(를) 바꿀 수 있다.")
    @MethodSource("UpdateBelongingTestParams")
    @DisplayName("사원 소속정보 변경 테스트")
    void updateCurrentBelonging_test_fail(String description, UpdateBelongingTestParam param) {
        Emp emp = getApprovedEmp();
        addBelongings(emp);

        emp.changeBelongingsByHR(
                param.dept(), param.position(), param.isPrimary(), param.startAt(), param.endAt()
        );
    }

    @Test
    @DisplayName("소속정보는 주 소속정보가 없으면 바꿀 수 없다.")
    void updateCurrentBelonging_test_fail() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                emp.changeBelongingsByHR(
                        null, PositionCode.DIRECTOR, true, LocalDate.of(2026, 4, 1), null
                )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("주 소속정보를 바꾸면 다른 주 소속정보는 비활성화 된다.")
    void updatePrimaryBelonging_test() {
        Emp emp = getApprovedEmp();
        emp.changeBelongingsByHR(
                Dept.registerDept("firstDept", "first"),
                PositionCode.DIRECTOR, true, LocalDate.of(2026, 4, 1), null
        );

        emp.changeBelongingsByHR(
                Dept.registerDept("secondDept", "second"),
                PositionCode.DIRECTOR, true, LocalDate.of(2026, 4, 1), null
        );

        EmpBelongings first = emp.getEmpBelongings().getFirst();
        EmpBelongings second = emp.getEmpBelongings().get(1);

        assertThat(first.isPrimary()).isFalse();
        assertThat(second.isPrimary()).isTrue();

    }


    @Builder
    private record UpdateBelongingTestParam(
            Dept dept,
            PositionCode position,
            Boolean isPrimary,
            LocalDate startAt,
            LocalDate endAt
    ) {}

    @Test
    @DisplayName("새로운 비밀번호는 영문 + 숫자 + 특수문자를 포함해야한다")
    void validate_Password_success() {
        Emp emp =  getApprovedEmp();

        emp.changeInfoByHR(
                null,
                "!Q2w3e4r5t_",
                null,
                null,
                null,
                null,
                encoder
        );

        emp.changeInfoBySelf(
                null,
                "!Q2w3e4r5t_12",
                encoder
        );
    }

    @Test
    @DisplayName("Active상태가 아닌 사원의 정보는 변경할 수 없다")
    void cant_change_deactivate_emp_info_fail() {
        Emp registeredEmp = getRegisteredEmp();

        assertThatThrownBy(() ->
            registeredEmp.changeInfoBySelf(
                    "111-1111",
                    null,
                    encoder)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            registeredEmp.changeInfoByDeptManager(
                    "111-1111",
                    null)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            registeredEmp.changeInfoByHR(
                    null,
                    null,
                    "111-1111",
                    null,
                    null,
                    null,
                    null)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("변경할 내용이 없으면, 예외발생")
    void cant_change_unchangeable_emp_info_fail() {
        Emp approvedEmp = getApprovedEmp();

        assertThatThrownBy(() ->
            approvedEmp.changeInfoBySelf(
                    null,
                    null,
                    encoder)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            approvedEmp.changeInfoByDeptManager(
                    null,
                    null)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            approvedEmp
                    .changeInfoByHR(
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null)
        ).isInstanceOf(IllegalStateException.class);
    }
}
