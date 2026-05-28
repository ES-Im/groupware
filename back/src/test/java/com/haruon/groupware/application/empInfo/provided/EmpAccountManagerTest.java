package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.empService.dto.request.*;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpLeaveRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.empInfo.DuplicateEmpNoException;
import com.haruon.groupware.application.exception.empInfo.DuplicateLoginIdException;
import com.haruon.groupware.application.exception.empInfo.EmpAlreadyActiveException;
import com.haruon.groupware.application.exception.empInfo.InvalidResignDateException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.domain.empInfo.*;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.PositionCode;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.*;

import java.time.LocalDate;
import java.util.*;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record EmpAccountManagerTest(
        EmpAccountManager empAccountManager,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        EmpLeaveRepository empLeaveRepository,
        EntityManager entityManager,
        EmpPasswordEncoder encoder
) {

    @AfterEach
    void tearDown() {
        System.out.println("===== deleteAll =====");
        empLeaveRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @TestFactory
    @DisplayName("회원가입 성공/실패 케이스")
    Collection<DynamicTest> registerEmp_when_emp_already_exists() {
        String empNo = "202601001";
        String loginId = "test12345";

        return List.of(
                DynamicTest.dynamicTest("사번과 아이디가 중복되지 않으면 회원이 등록된다.", () -> {
                    empAccountManager.registerEmp(EmpRegisterRequest.builder()
                            .empNo(empNo)
                            .name("사원1")
                            .loginId(loginId)
                            .password("Test!1234")
                            .build()
                    );

                    Emp emp = empRepository.findByEmpNo("202601001").orElseThrow(() -> new RuntimeException("해당 사원이 없음"));
                    assertThat(emp.getId()).isNotNull();
                }), DynamicTest.dynamicTest("이미 존재하는 사원번호 입력시 회원이 등록되지 않는다.", () -> {
                    assertThatThrownBy(() ->
                            empAccountManager.registerEmp(EmpRegisterRequest.builder()
                                    .empNo(empNo)
                                    .name("사원2")
                                    .loginId("loginId2")
                                    .password("Test!1234")
                                    .build()
                            )
                    ).isInstanceOf(DuplicateEmpNoException.class);
                }), DynamicTest.dynamicTest("이미 존재하는 아이디 입력시 회원이 등록되지 않는다.", () -> {
                    assertThatThrownBy(() ->
                            empAccountManager.registerEmp(EmpRegisterRequest.builder()
                                    .empNo("202601002")
                                    .name("사원2")
                                    .loginId(loginId)
                                    .password("Test!1234")
                                    .build()
                            )
                    ).isInstanceOf(DuplicateLoginIdException.class);
                })
        );
    }

    @Test
    @DisplayName("HR 권한을 가진 사원이 사원의 회원가입을 승인할 수 있다.")
    void approveRegisterByHR() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

        Emp registered = saveRegisteredEmp(empRepository);

        System.out.println("===== approve 시작 =====");
        empAccountManager.approveRegisterByHR(
                hrEmp.getId(),
                registered.getId(),
                LocalDate.of(2026,4,1)
        );
        System.out.println("===== approve 종료 =====");

        entityManager.clear();

        empRepository.findByEmpNo(registered.getEmpNo()).ifPresent(emp -> {
            assertThat(emp.getStatus()).isEqualTo(EmpStatus.ACTIVE);

        });
    }

    @Test
    @DisplayName("HR 권한을 가진 사원이 사원의 회원가입을 승인 시, 해당 사원의 연가정보가 월할계산 되어 저장된다.")
    void createAnnualLeaveAfterApproveRegisterByHR() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

        Emp registered = saveRegisteredEmp(empRepository);

        empAccountManager.approveRegisterByHR(
                        hrEmp.getId(),
                        registered.getId(),
                        LocalDate.of(2026,4,1)
        );

        Emp emp = empRepository.findByEmpNo(registered.getEmpNo()).orElseThrow();
        EmpLeave empLeave = empLeaveRepository.findByEmpIdAndGrantYear(
                emp.getId(),
                emp.getHiredAt().getYear()
        ).orElseThrow();

        assertThat(empLeave.getAnnualBaseGrantDays()).isEqualTo(9);
    }

    @Test
    @DisplayName("HR 권한을 가진 사원 외에는 사원의 회원가입을 승인할 수 없다.")
    void approveRegisterBy_Not_HR_fail() {
         Emp normalEmp = saveApprovedEmp(empRepository);
         Emp registered = saveRegisteredEmp(empRepository);

         entityManager.clear();

         assertThatThrownBy(() ->
                 empAccountManager.approveRegisterByHR(
                                 normalEmp.getId(),
                                 registered.getId(),
                                 LocalDate.of(2026,4,1)
                 )
         ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("입사일자를 입력하지 않으면 회원가입을 승인할 수 없다.")
    void approveRegisterByHR_Without_hiredAt_fail() {

        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp registered = saveRegisteredEmp(empRepository);
        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

         assertThatThrownBy(() ->
                 empAccountManager.approveRegisterByHR(
                                 hrEmp.getId(),
                                 registered.getId(),
                                 null
                 )
         ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @DisplayName("어드민은 사원의 퇴직처리를 할 수 있다")
    void updateResignedEmpByHR_success() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp approvedEmp = saveApprovedEmp(empRepository);
        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

        System.out.println("===== resign emp 처리 시작 =====");
        empAccountManager.updateResignedEmpByHR(
                        hrEmp.getId(),
                        approvedEmp.getId(),
                        approvedEmp.getHiredAt().plusMonths(1)
        );

        entityManager.clear();

        empRepository.findByEmpNo(approvedEmp.getEmpNo()).ifPresent(emp -> {
            assertThat(emp.getStatus()).isEqualTo(EmpStatus.RESIGNED);
        });
    }

    // 퇴직일자가 이를때

    @Test
    @DisplayName("어드민이 아니라면 사원의 퇴직처리를 할 수 없다")
    void updateResignedEmpByEmployee_fail() {
        Emp normalEmp = saveApprovedEmp(empRepository);
        Emp targetEmp = saveApprovedEmp(empRepository, "202601003", "approvedEmp3");

        entityManager.clear();

        assertThatThrownBy(() ->
            empAccountManager.updateResignedEmpByHR(
                            normalEmp.getId(),
                            targetEmp.getId(),
                            targetEmp.getHiredAt().plusMonths(1)
            )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("퇴직일자를 입력하지 않으면 사원의 퇴직처리를 할 수 없다")
    void updateResignedEmpByHR_Without_ResignedAt_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp target = saveApprovedEmp(empRepository);
        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

        entityManager.clear();

        assertThatThrownBy(() ->
            empAccountManager.updateResignedEmpByHR(
                            hrEmp.getId(),
                            target.getId(),
                            null
            )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @DisplayName("퇴직일자를 입력하지 않으면 사원의 퇴직처리를 할 수 없다")
    void updateResignedEmpByhr_With_early_ResignedAt_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp target = saveApprovedEmp(empRepository);
        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", dept, SystemRoleCode.HR);

        entityManager.clear();

        assertThatThrownBy(() ->
            empAccountManager.updateResignedEmpByHR(
                            hrEmp.getId(),
                            target.getId(),
                            target.getHiredAt().minusMonths(1)
            )
        ).isInstanceOf(InvalidResignDateException.class);
    }

    @Test
    @DisplayName("사원은 본인의 정보(내선번호, 비밀번호)를 수정할 수 있다.")
    void update_info_by_oneself() {
        Emp emp = saveApprovedEmp(empRepository);

        empAccountManager.updateInfoBySelf(
                EmpUpdateRequestBySelf.builder()
                        .newRawPassword("new!1Password")
                        .extensionNo("123-0000")
                        .build(),
                emp.getId()
        );
    }

    @Transactional
    @Test
    @DisplayName("부서매니저 권한이 있는 사원은 같은 부서의 사원 직통번호와 시스템권한을 변경할 수 있다.")
    void updateInfoByDeptManager_success() {
        String deptCode = "001";
        String deptName = "HR";

        Dept dept = saveDept(deptRepository, deptName, deptCode);
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.DEPT_MANAGER
        );

        String updateExtensionNo = "999-9999";
        Set<SystemRoleCode> updatedRoles = Set.of(SystemRoleCode.EMPLOYEE, SystemRoleCode.DEPT_MANAGER);

        System.out.println("================ 변경 테스트 시작 ================");
        empAccountManager.updateInfoByDeptManager(
                EmpUpdateRequestByDeptManager.builder()
                        .targetEmpId(targetEmp.getId())
                        .systemRoleCode(updatedRoles)
                        .extensionNo(updateExtensionNo)
                        .build(),
                deptManager.getId()
        );

        Emp foundEmp = empRepository.findByEmpNo(targetEmp.getEmpNo()).orElseThrow();
        Set<SystemRoleCode> roles = new HashSet<>(foundEmp.getSystemRoles());

        assertThat(foundEmp.getExtensionNo()).isEqualTo(updateExtensionNo);
        assertThat(roles).containsExactlyInAnyOrderElementsOf(updatedRoles);
    }

    @Test
    @DisplayName("사원과 부서매니저가 부서가 다르면 변경할 수 없다.")
    void updateInfoBy_other_DeptManager_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Dept otherDept = saveDept(deptRepository, "002", "IT");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", otherDept, SystemRoleCode.DEPT_MANAGER
        );

        System.out.println("================ 변경 테스트 시작 ================");
        assertThatThrownBy(() ->
                empAccountManager.updateInfoByDeptManager(
                        EmpUpdateRequestByDeptManager.builder()
                                .targetEmpId(targetEmp.getId())
                                .systemRoleCode(Set.of(SystemRoleCode.DEPT_MANAGER))
                                .extensionNo("999-9999")
                                .build(),
                        deptManager.getId()
                )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("부서매니저가 아니라면 부서매니저 권한으로 사원의 정보를 변경할 수 없다.")
    void updateInfo_By_Not_DeptManager_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp otherEmp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.EMPLOYEE
        );

        System.out.println("================ 변경 테스트 시작 ================");
        assertThatThrownBy(() ->
                empAccountManager.updateInfoByDeptManager(
                        EmpUpdateRequestByDeptManager.builder()
                                .targetEmpId(targetEmp.getId())
                                .systemRoleCode(Set.of(SystemRoleCode.DEPT_MANAGER))
                                .extensionNo("999-9999")
                                .build(),
                        otherEmp.getId()
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("부서매니저는 같은 부서의 사원 시스템 롤을 자신보다 높은 등급(ADMIN)으로 수정할 수 없다")
    void updateInfo_ByDeptManager_For_Switch_ADMIN_ROLE_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp otherEmp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.EMPLOYEE
        );

        System.out.println("================ 변경 테스트 시작 ================");
        assertThatThrownBy(() ->
                empAccountManager.updateInfoByDeptManager(
                        EmpUpdateRequestByDeptManager.builder()
                                .targetEmpId(targetEmp.getId())
                                .systemRoleCode(Set.of(SystemRoleCode.ADMIN))
                                .extensionNo("999-9999")
                                .build(),
                        otherEmp.getId()
                )
        ).isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @Transactional
    @DisplayName("HR 권한을 가진 사원은 모든 사원의 개인정보를 수정할 수 있다.")
    void updateInfoByHR_success() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Dept otherDept = saveDept(deptRepository, "002", "IT");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp hrEmp = saveEmpWithRoleAndDept(empRepository, deptRepository, "202603001", "loginid03", otherDept, SystemRoleCode.HR);

        String newName = "editName";
        String newExtensionNo = "888-9999";
        String newRawPassword = "!1newPassword";
        EmpStatus newEmpStatus = EmpStatus.ACTIVE;
        Set<SystemRoleCode> newSystemRoleCodes = Set.of(SystemRoleCode.DEPT_MANAGER, SystemRoleCode.HR);
        PositionCode newPosition = PositionCode.ASSISTANT_MANAGER;

        EmpBelongingsParam newBelongingsParam = EmpBelongingsParam.builder()
                .targetEmpId(targetEmp.getId())
                .dept(dept)
                .position(newPosition)
                .isPrimary(true)
                .startAt(LocalDate.of(2026,4,15))
                .endAt(null)
                .build();

        empAccountManager.updateInfoByHR(
                EmpUpdateRequestByHR.builder()
                        .targetEmpId(targetEmp.getId())
                        .empName(newName)
                        .newRawPassword(newRawPassword)
                        .extensionNo(newExtensionNo)
                        .empStatus(newEmpStatus)
                        .systemRoleCode(newSystemRoleCodes)
                .build(),
                hrEmp.getId()
        );


        empAccountManager.updateBelongingsByHR(
                newBelongingsParam, hrEmp.getId()
        );

        Emp foundEmp = empRepository.findByEmpNo(targetEmp.getEmpNo()).orElseThrow();
        Set<SystemRoleCode> roles = new HashSet<>(foundEmp.getSystemRoles());
        ArrayList<EmpBelongings> empBelongings = new ArrayList<>(foundEmp.getEmpBelongings());

        List<Dept> newDeptList = getBelongings(empBelongings);

        List<PositionCode> newPositionList = getPositionList(empBelongings);

        empRepository.findByEmpNo("202601001").ifPresent(emp -> {
            assertThat(emp.getEmpName()).isEqualTo(newName);
            assertThat(emp.getExtensionNo()).isEqualTo(newExtensionNo);
            assertThat(encoder.matches(newRawPassword, emp.getEmpPassword())).isTrue();
            assertThat(emp.getStatus()).isEqualTo(newEmpStatus);
            assertThat(roles).containsExactlyInAnyOrderElementsOf(newSystemRoleCodes);
            assertThat(newDeptList).contains(dept);
            assertThat(newPositionList).contains(newPosition);
        });
    }

    private static List<PositionCode> getPositionList(ArrayList<EmpBelongings> empBelongings) {
        return empBelongings.stream()
                .map(EmpBelongings::getPosition)
                .toList();
    }

    private static List<Dept> getBelongings(ArrayList<EmpBelongings> empBelongings) {
        return empBelongings.stream()
                .map(EmpBelongings::getDept)
                .toList();
    }

    @Transactional
    @Test
    @DisplayName("관리자는 비활성 상태 사원의 정보를 수정할 수 없다.")
    void updateInactiveEmpByHR_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp otherEmp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.HR
        );

        empAccountManager.updateInfoByHR(
                EmpUpdateRequestByHR.builder()
                        .targetEmpId(targetEmp.getId())
                        .empStatus(EmpStatus.SUSPENDED)
                        .build(),
                otherEmp.getId()
        );

        entityManager.flush();
        entityManager.clear();

        Emp changedEmp = empRepository.findById(targetEmp.getId()).orElseThrow();
        assertThat(changedEmp.getStatus()).isEqualTo(EmpStatus.SUSPENDED);

        assertThatThrownBy(() ->
                empAccountManager.updateInfoByHR(
                        EmpUpdateRequestByHR.builder()
                                .targetEmpId(targetEmp.getId())
                                .empName("newName")
                                .build(),
                        otherEmp.getId()
                )
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
    }

    @Test
    @DisplayName("관리자는 사원 상태를 활성화 시킬 수 있다.")
    void activateEmpByHR() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp hrEmp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.HR
        );

        empAccountManager.updateInfoByHR(
                EmpUpdateRequestByHR.builder()
                        .targetEmpId(targetEmp.getId())
                        .empStatus(EmpStatus.SUSPENDED)
                        .build(),
                hrEmp.getId()
        );

        empAccountManager.activateEmpByHR(hrEmp.getId(), targetEmp.getId());

        empRepository.findById(targetEmp.getId()).ifPresent(emp -> {
            assertThat(emp.getStatus()).isEqualTo(EmpStatus.ACTIVE);
        });
    }

    @Test
    @DisplayName("이미 활성화 상태인 사원 상태를 활성화 시킬 수 없다.")
    void activate_already_active_EmpByHR_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "login1234", dept);
        Emp hrEmp = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "deptManager", dept, SystemRoleCode.HR
        );

        assertThatThrownBy(() ->
                empAccountManager.activateEmpByHR(hrEmp.getId(), targetEmp.getId())
        ).isInstanceOf(EmpAlreadyActiveException.class);
    }

    @Transactional
    @Test
    @DisplayName("사원은 본인의 프로필사진 또는 전자결재 서명이미지를 추가할 수 있다.")
    void updateEmpFileBySelf_success() {
        Emp emp = saveApprovedEmp(empRepository);


        String imageName = "random";
        long fileSize = 1024 * 1024L;
        String ext = "png";
        String mimeType = "image/png";
        FileDto fileInfo = FileDto.builder()
                .mimeType(mimeType)
                .originalFileFullName(imageName.concat(".").concat(ext))
                .fileSize(fileSize)
                .bytes(new byte[]{1})
                .build();

        FileType signature = FileType.SIGNATURE;

        empAccountManager.updateEmpFileBySelf(
                EmpFileReplaceParam.builder()
                        .file(fileInfo)
                        .fileType(signature)
                        .build(),
                emp.getId()
        );

        Emp afterEmp = empRepository.findById(emp.getId()).orElseThrow();

        List<EmpFile> empFiles = afterEmp.getEmpFiles();


        assertThat(empFiles).singleElement().extracting(
                EmpFile::getEmp, EmpFile::getFileType, EmpFile::isActive,
                EmpFile::getOriginalName, EmpFile::getFileSize,
                EmpFile::getMimeType, EmpFile::getExtension
        ).containsExactly(
                emp, signature, true,
                imageName, fileSize,
                mimeType, ext
        );

        assertThat(empFiles.getLast().getStoredName()).isNotNull();
    }

    @Transactional
    @Test
    @DisplayName("사원은 본인의 프로필사진/서명파일을 삭제할 수 있다.")
    void deleteEmpFile_BySelf_success() {
        String empNo = findEmpNoHasFile();

        entityManager.flush();
        entityManager.clear();

        Emp emp = empRepository.findByEmpNo(empNo).orElseThrow();
        List<EmpFile> empFiles = emp.getEmpFiles();
        empAccountManager.deleteEmpFileBySelf(empFiles.getFirst().getId(), emp.getId());

        assertThat(empRepository.findById(emp.getId()).orElseThrow().getEmpFiles()).isEmpty();
    }

    @Transactional
    @Test
    @DisplayName("관리자는 사원의 파일을 비활성화할 수 있다")
    void updateFileActiveStatus_ByHr_success() {
        String empNo = findEmpNoHasFile();
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp editor = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601999", "deptManager", dept, SystemRoleCode.HR
        );

        Emp emp = empRepository.findByEmpNo(empNo).orElseThrow();
        List<EmpFile> empFiles = emp.getEmpFiles();
        long fileId = empFiles.getFirst().getId();

        empAccountManager.updateFileActiveStatusByHR(
                        editor.getId(),
                        emp.getId(),
                        fileId,
                        false
        );

        entityManager.flush();
        entityManager.clear();

        Emp foundEmp = empRepository.findById(emp.getId()).orElseThrow();
        EmpFile foundFile = foundEmp.getEmpFiles().stream()
                .filter(file -> file.getId().equals(fileId))
                .findFirst()
                .orElseThrow();

        assertThat(foundFile.isActive()).isFalse();
    }



    @Transactional
    @Test
    @DisplayName("사원은 본인의 파일을 비활성화/활성화 할 수 있다.")
    void updateFileActiveStatus_ByHr_success_for_self() {
        String empNo = findEmpNoHasFile();

        Emp emp = empRepository.findByEmpNo(empNo).orElseThrow();
        List<EmpFile> empFiles = emp.getEmpFiles();
        long fileId = empFiles.getFirst().getId();

        empAccountManager.updateFileActiveStatusBySelf(fileId, false, emp.getId());

        Emp foundEmp = empRepository.findById(emp.getId()).orElseThrow();
        EmpFile foundFile = foundEmp.getEmpFiles().stream()
                .filter(file -> file.getId().equals(fileId))
                .findFirst()
                .orElseThrow();

        assertThat(foundFile.isActive()).isFalse();
    }

    private String findEmpNoHasFile() {
        Emp emp = saveApprovedEmp(empRepository);

        String imageName = "random";
        long fileSize = 1024 * 1024L;
        String ext = "png";
        String mimeType = "image/png";
        FileDto fileInfo = FileDto.builder()
                .mimeType(mimeType)
                .originalFileFullName(imageName.concat(".").concat(ext))
                .fileSize(fileSize)
                .bytes(new byte[]{1})
                .build();

        FileType signature = FileType.SIGNATURE;

        empAccountManager.updateEmpFileBySelf(
                EmpFileReplaceParam.builder()
                        .file(fileInfo)
                        .fileType(signature)
                        .build(),
                emp.getId()
        );

        return emp.getEmpNo();
    }

}
