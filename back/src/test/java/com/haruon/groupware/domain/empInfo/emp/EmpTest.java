package com.haruon.groupware.domain.empInfo.emp;

import com.haruon.groupware.domain.empInfo.emp.dto.*;
import com.haruon.groupware.domain.empInfo.emp.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.emp.enums.FileType;
import com.haruon.groupware.domain.empInfo.emp.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.emp.enums.SystemRoleCode;
import com.haruon.groupware.domain.shared.EmpFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
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
        assertThat(pendingEmp.getEmpId()).isNotNull();
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
        EmpFile addedFile = addFileWithType(approvedEmp, FileType.PROFILE_PICTURE, approvedEmp.getEmpPassword());
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

        resignedEmp.changeResignedEmpInfoByAdmin(resignedAt);

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
                EmpSelfUpdateParam.builder()
                    .inputPassword(emp.getEmpPassword())
                    .extensionNo("123-4567")
                    .build()
                , encoder);

        assertThat(emp.getExtensionNo()).isEqualTo("123-4567");
    }

    @Test
    @DisplayName("본인은 비밀번호를 변경할 수 있다")
    void change_Password_BySelf_success() {
        Emp emp = getApprovedEmp();
        String oldPassword = emp.getEmpPassword();

        emp.changeInfoBySelf(
                EmpSelfUpdateParam.builder()
                    .inputPassword(oldPassword)
                    .newRawPassword("!Qw123456")
                    .build()
                , encoder);

        assertThat(emp.getEmpPassword()).isNotEqualTo(oldPassword);
    }

    @Test
    @DisplayName("본인의 이미지파일을 등록할 수 있다.")
    void add_emp_file_by_Self_success() {
        Emp emp = getApprovedEmp();

        emp.changeInfoBySelf(EmpSelfUpdateParam.builder()
                .inputPassword(currentPassword)
                .fileRequest(fileParam(FileType.PROFILE_PICTURE))
                .build(), encoder);

        assertThat(emp.getEmpFiles()).hasSize(1);
        assertThat(emp.getEmpFiles().getFirst().getFileType()).isEqualTo(FileType.PROFILE_PICTURE);
        assertThat(emp.getEmpFiles().getFirst().isActive()).isTrue();
    }

    @Test
    @DisplayName("같은 타입의 이미지를 등록한다면 같은 타입 중 다른 파일이 비활성화 된다.")
    void add_emp_file_by_Self_success_and_deactivate_same_type_others() {
        Emp emp = getApprovedEmp();

        addFileWithType(emp, FileType.PROFILE_PICTURE, currentPassword);
        addFileWithType(emp, FileType.PROFILE_PICTURE, currentPassword);

        assertThat(emp.getEmpFiles()).hasSize(2);
        assertThat(emp.getEmpFiles().stream().filter(EmpFile::isActive)).hasSize(1);
    }

    @Test
    @DisplayName("본인 정보를 수정할때 비밀번호를 입력해야한다")
    void change_EmpInfo_BySelf_WithoutPassword_success() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                emp.changeInfoBySelf(EmpSelfUpdateParam.builder()
                        .newRawPassword("!Qw123456")
                        .extensionNo("000-0000")
                        .build(), encoder)
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("부서시스템담당자는 직원의 시스템권한을 변경할 수 있다")
    void change_SystemRole_ByDeptManager_success() {
        Emp emp = getApprovedEmp();

        emp.changeInfoByDeptManager(
                EmpDeptManagerUpdateParam.builder()
                        .systemRoleCode(SystemRoleCode.DEPT_MANAGER)
                        .build()
        );
    }

    @Test
    @DisplayName("부서시스템담당자는 부서시스템이상의 시스템권한을 부여할 수 없다")
    void change_SystemRole_ByDeptManager_fail() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                emp.changeInfoByDeptManager(
                        EmpDeptManagerUpdateParam.builder()
                                .systemRoleCode(SystemRoleCode.ADMIN)
                                .build()
                )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("부서시스템담당자는 직원의 내선번호를 수정할 수 있다.")
    void change_extensionNo_ByDeptManager_fail() {
        Emp emp = getApprovedEmp();

        emp.changeInfoByDeptManager(
                EmpDeptManagerUpdateParam.builder()
                        .extensionNo("111-1111")
                        .build()
        );
    }

    private static Stream<Arguments> empUpdateByAdminParams() {
        return Stream.of(
                Arguments.of("이름을 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").empName("EditedName").build()),
                Arguments.of("사번을 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").empId("202603999").build()),
                Arguments.of("비밀번호를 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").newRawPassword(")p9o8i7u6y").build()),
                Arguments.of("내선번호를 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").extensionNo("999-9999").build()),
                Arguments.of("입사일자를 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").hireAt(LocalDate.of(2025,1,1)).build()),
                Arguments.of("직무상태를 변경할 수 있다.", EmpAdminUpdateParam.builder().companyDomain("@haruon.com").empStatus(EmpStatus.SUSPENDED).build())
        );
    }
    @ParameterizedTest(name = "{index} => 시스템총괄(ADMIN)은 {0}")
    @DisplayName("시스템 총괄 사원 기본정보 변경 성공 테스트")
    @MethodSource("empUpdateByAdminParams")
    void change_basic_empInfo_ByAdmin(String description, EmpAdminUpdateParam params) {
        Emp emp = getApprovedEmp(); 
        emp.changeInfoByAdmin(params, encoder);
    }

    @Test
    @DisplayName("시스템 총괄은 사원 파일을 비활성화할 수 있다")
    void deactivate_emp_file_by_admin() {
        Emp emp = getApprovedEmp();
        EmpFile file1 = addFileWithType(emp, FileType.PROFILE_PICTURE, currentPassword);
        ReflectionTestUtils.setField(file1, "id", 1L);

        emp.changeInfoByAdmin(EmpAdminUpdateParam.builder()
                        .changeFileActive(EmpFileStatusChangeParam.builder()
                                .id(1L)
                                .targetActive(false)
                                .build())
                        .companyDomain("@haruon.com")
                        .build(),
                null);

        assertThat(file1.isActive()).isFalse();
    }

    @Test
    @DisplayName("같은 타입 파일을 활성화하면 기존 활성 파일은 비활성화된다")
    void activate_emp_file_by_admin_and_deactivate_same_type_others() {
        Emp emp = getApprovedEmp();
        EmpFile file1 = addFileWithType(emp, FileType.PROFILE_PICTURE, currentPassword);
        EmpFile file2 = addFileWithType(emp, FileType.PROFILE_PICTURE, currentPassword);

        ReflectionTestUtils.setField(file1, "id", 1L);
        ReflectionTestUtils.setField(file2, "id", 2L);

        emp.changeInfoByAdmin(EmpAdminUpdateParam.builder()
                        .changeFileActive(EmpFileStatusChangeParam.builder()
                                .id(1L)
                                .targetActive(true)
                                .build())
                        .companyDomain("@haruon.com")
                        .build(),
                null);

        assertThat(file1.isActive()).isTrue();
        assertThat(file2.isActive()).isFalse();
    }

    @Test
    @DisplayName("시스템 총괄은 사원의 소속정보를 등록할 수 있다.")
    void add_emp_belongs_ByAdmin() {
        Emp emp = getApprovedEmp();

        EmpBelongingsParam empBelongingsParam = EmpBelongingsParam.builder()
                .dept(getDept())
                .position(PositionCode.STAFF)
                .isPrimary(true)
                .startAt(LocalDate.of(2026, 1, 1))
                .build();

        emp.changeInfoByAdmin(
                EmpAdminUpdateParam.builder()
                        .belongingsParam(empBelongingsParam)
                        .companyDomain("@haruon.com")
                        .build()
                , null);

        assertThat(emp.getEmpBelongings())
                .singleElement()
                .satisfies(belongings -> {
                    assertThat(belongings.getDept()).isEqualTo(empBelongingsParam.dept());
                    assertThat(belongings.getPosition()).isEqualTo(empBelongingsParam.position());
                    assertThat(belongings.isPrimary()).isEqualTo(empBelongingsParam.isPrimary());
                    assertThat(belongings.getStartAt()).isEqualTo(empBelongingsParam.startAt());
                    assertThat(belongings.getEndAt()).isEqualTo(empBelongingsParam.endAt());
                });
    }

    @Test
    @DisplayName("시스템 총괄은 사원의 소속정보를 수정할 수 있다.")
    void change_emp_belongs_ByAdmin() {
        Emp emp = getApprovedEmp();

        addBelongings(emp);

        emp.changeInfoByAdmin(
                EmpAdminUpdateParam.builder()
                        .belongingsParam(EmpBelongingsParam.builder()
                                .isPrimary(false)
                                .build())
                .companyDomain("@haruon.com")
                .build()
        ,null);

        assertThat(emp.getEmpBelongings()).singleElement()
                .satisfies(e -> {
                    assertThat(e.isPrimary()).isFalse();
                });
    }

    @Test
    @DisplayName("새로운 비밀번호는 영문 + 숫자 + 특수문자를 포함하며, 이전비밀번호와 달라야한다.")
    void validate_Password_success() {
        Emp emp =  getApprovedEmp();

        EmpAdminUpdateParam adminUpdateParam = EmpAdminUpdateParam.builder()
                .newRawPassword("!Q2w3e4r5t_")
                .companyDomain("@haruon.com")
                .build();
        emp.changeInfoByAdmin(adminUpdateParam, encoder);

        EmpSelfUpdateParam selfUpdateParam = EmpSelfUpdateParam.builder()
                .newRawPassword("!Q2w3e4r5t__")
                .inputPassword("!Q2w3e4r5t_")
                .build();
        emp.changeInfoBySelf(selfUpdateParam, encoder);
    }

    @Test
    @DisplayName("이전비밀번호와 같다면 실패")
    void validate_Password_fail() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                emp.changeInfoBySelf(EmpSelfUpdateParam.builder().newRawPassword(currentPassword).inputPassword(currentPassword).build(), encoder)
        ).isInstanceOf(IllegalStateException.class);
    }


    @Test
    @DisplayName("Active상태가 아닌 사원의 정보는 변경할 수 없다")
    void cant_change_deactivate_emp_info_fail() {
        Emp registeredEmp = getRegisteredEmp();

        assertThatThrownBy(() ->
            registeredEmp.changeInfoBySelf(
                    EmpSelfUpdateParam.builder()
                        .extensionNo("111-1111")
                        .build()
                    , encoder)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            registeredEmp.changeInfoByDeptManager(
                    EmpDeptManagerUpdateParam.builder()
                        .extensionNo("111-1111")
                        .build()
            )
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            registeredEmp.changeInfoByAdmin(
                    EmpAdminUpdateParam.builder()
                        .extensionNo("111-1111")
                        .build()
                    , null)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("변경할 내용이 없으면, 예외발생")
    void cant_change_unchangeable_emp_info_fail() {
        Emp approvedEmp = getApprovedEmp();

        assertThatThrownBy(() ->
            approvedEmp.changeInfoBySelf(
                    EmpSelfUpdateParam.builder()
                            .build()
                    , encoder)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            approvedEmp.changeInfoByDeptManager(
                    EmpDeptManagerUpdateParam.builder()
                    .build()
            )
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            approvedEmp.changeInfoByAdmin(
                    EmpAdminUpdateParam.builder()
                            .build()
                    , null)
        ).isInstanceOf(IllegalStateException.class);
    }
}