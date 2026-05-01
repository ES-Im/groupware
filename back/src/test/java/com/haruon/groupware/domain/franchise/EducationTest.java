package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.franchise.franchiseFixture.getFranchise;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EducationTest {

    @Test
    @DisplayName("교육생성 테스트")
    void create_success() {
        Emp emp = getApprovedEmp();
        LocalDateTime educationDate = LocalDateTime.of(2026, 4, 5, 0, 0, 0);
        String place = "testPlace";
        String title = "testTitle";
        String content = "testContent";
        Long capacity = 20L;

        Education education = Education.create(emp, educationDate, place, title, content, capacity);

        assertThat(education).extracting(
                Education::getEmp,
                Education::getEducationDate,
                Education::getPlace,
                Education::getTitle,
                Education::getContent,
                Education::getCapacity
        ).containsExactly(
                emp, educationDate, place, title, content, capacity
        );

        assertThat(education.isActive())
                .as("교육 생성시, 기본 활성화여부는 false이다")
                .isFalse();

    }
    @Test
    @DisplayName("교육생성 시, 수용인원이 양수가 아니면 실패")
    void create_when_capacity_is_not_positive_fail() {
        Emp emp = getApprovedEmp();
        LocalDateTime educationDate = LocalDateTime.of(2026, 4, 5, 0, 0, 0);
        String place = "testPlace";
        String title = "testTitle";
        String content = "testContent";
        Long capacity = 0L;

        assertThatThrownBy(() ->
                Education.create(emp, educationDate, place, title, content, capacity)
        ).hasMessage("수용인원은 0보다 커야함");

    }

    @Test
    @DisplayName("교육 내용 변경 테스트")
    void change_education_info_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        LocalDateTime newEducationDate = LocalDateTime.of(2026, 4, 6, 0, 0, 0);
        String newPlace = "newPlace";
        String newTitle = "newTitle";
        String newContent = "newContent";
        Long newCapacity = 30L;

        education.changeEducationInfo(newEducationDate, newPlace, newTitle, newContent, newCapacity);

        assertThat(education).extracting(
                Education::getEducationDate,
                Education::getPlace,
                Education::getTitle,
                Education::getContent,
                Education::getCapacity
        ).containsExactly(
                newEducationDate, newPlace, newTitle, newContent, newCapacity
        );
    }

    @Test
    @DisplayName("교육 내용 변경시, 활성화 상태라면 실패한다.")
    void change_education_info_when_capacity_is_not_positive_fail() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        education.activate();

       assertThatThrownBy(() ->
               education.changeEducationInfo(LocalDateTime.of(2026, 4, 6, 0, 0, 0), "newPlace", "newTitle", "newContent", 30L)
       ).hasMessage("교육 비활성화 상태에서만 수정 가능");
    }

    @Test
    @DisplayName("교육 내용 변경시, 변경할 내용이 없으면 실패한다.")
    void change_education_info_without_changeable_instance_fail() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        assertThatThrownBy(() ->
               education.changeEducationInfo(null,null,null,null,null)
        ).hasMessage("변경할 내용이 없음");
    }

    @Test
    @DisplayName("교육 활성화")
    void activate_education_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        education.activate();

        assertTrue(education.isActive());
    }

    @Test
    @DisplayName("교육 비활성화")
    void deactivate_education_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        education.activate();
        education.deactivate();

        assertFalse(education.isActive());
    }

    @Test
    @DisplayName("이미 참가신청 건이 있으면 교육 비활성화를 할 수 없다.")
    void deactivate_education_when_already_someone_participated_fail() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        education.activate();
        education.applyByFranchise("ex", getFranchise(), 10L, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        assertThatThrownBy(education::deactivate).hasMessage("교육 참가 신청이 없을 때만 비활성화 가능");
    }

    @Test
    @DisplayName("활성화된 교육 대상으로 참가신청을 할 수 있다.")
    void applyByFranchise_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );
        education.activate();

        String externalId = "ex";
        Franchise franchise = getFranchise();
        long appliedCount = 10L;
        LocalDateTime appliedAt = LocalDateTime.of(2026, 4, 6, 0, 0, 0);

        education.applyByFranchise(externalId, franchise, appliedCount, appliedAt);

        assertThat(education.getEducationApplications()).singleElement().satisfies(a -> {
            assertThat(a).extracting(
                    EducationApplication::getExternalId,
                    EducationApplication::getFranchise,
                    EducationApplication::getAppliedCount,
                    EducationApplication::getAppliedAt
            ).containsExactly(
                    externalId, franchise, appliedCount, appliedAt
            );
        });

    }

    @Test
    @DisplayName("신청건을 취소할 수 있다.")
    void cancelApplication_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );
        education.activate();

        String externalId = "ex";
        Franchise franchise = getFranchise();
        education.applyByFranchise(externalId, franchise, 10L, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        education.cancelApplication(externalId, franchise);

        assertThat(education.getEducationApplications()).isEmpty();
    }

    @Test
    @DisplayName("신청 정보가 없는 외부 식별자로 신청을 취소할 수 없다.")
    void cancelApplication_fail() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );
        education.activate();

        String externalId = "ex";
        Franchise franchise = getFranchise();
        education.applyByFranchise(externalId, franchise, 10L, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        assertThatThrownBy(() ->
                education.cancelApplication("otherId", franchise)
        ).hasMessage("해당 신청정보가 없음");
    }

    @Test
    @DisplayName("참가신청 시, 기존 신청건 포함 교육 수용인원을 초과할 수 없다.")
    void applyByFranchise_when_capacity_is_exceeded_fail() {
        long educationCapacity = 20L;
        long previousAppliedCount = educationCapacity - 1L;
        long appliedCount = 2L;

        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", educationCapacity
        );
        education.activate();

        education.applyByFranchise("ex1", getFranchise(), previousAppliedCount, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        assertThatThrownBy(() ->
                education.applyByFranchise("ex2", getFranchise(), appliedCount, LocalDateTime.of(2026, 4, 6, 0, 0, 0))
        ).hasMessage("수용인원을 초과하여 신청 불가");
    }

    @Test
    @DisplayName("참가신청 시, 교육 신청 인원이 양수가 아니라면 실패한다.")
    void applyByFranchise_when_capacity_is_negative_fail() {
        long educationCapacity = 20L;
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", educationCapacity
        );
        education.activate();

        long appliedCount = 0L;


        assertThatThrownBy(() ->
                education.applyByFranchise("ex", getFranchise(), appliedCount, LocalDateTime.of(2026, 4, 6, 0, 0, 0))
        ).hasMessage("신청인원은 양수여야 한다.");
    }

    @Test
    @DisplayName("참가신청 변경 테스트")
    void replaceApplicatn_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );
        education.activate();

        String externalId = "ex";
        Franchise franchise = getFranchise();
        long newAppliedCount = 11L;
        LocalDateTime newAppliedAt = LocalDateTime.of(2026, 4, 7, 0, 0, 0);

        education.applyByFranchise(externalId, franchise, 10L, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        education.replaceApplication(externalId, franchise, newAppliedCount, newAppliedAt);

        assertThat(education.getEducationApplications()).singleElement().satisfies(a -> {
            assertThat(a).extracting(
                    EducationApplication::getExternalId,
                    EducationApplication::getAppliedCount,
                    EducationApplication::getAppliedAt
            ).containsExactly(
                    externalId, newAppliedCount, newAppliedAt
            );
        });
    }

    @Test
    @DisplayName("참가신청 변경 시, 기존 신청건 포함하여 신청인원이 수용인원을 초과하면 실패한다.")
    void replaceApplicatn_when_capacity_is_exceeded_fail() {
        long educationCapacity = 20L;
        long previousAppliedCount = educationCapacity - 1L;
        long appliedCount = 2L;

        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", educationCapacity
        );
        education.activate();

        Franchise franchise = getFranchise();
        education.applyByFranchise("ex1", franchise, previousAppliedCount, LocalDateTime.of(2026, 4, 6, 0, 0, 0));

        LocalDateTime newAppliedAt = LocalDateTime.of(2026, 4, 7, 0, 0, 0);

        education.applyByFranchise("ex2", franchise, 1L, LocalDateTime.of(2026, 4, 6, 0, 0, 0));


        assertThatThrownBy(() ->
                education.replaceApplication("ex2", franchise, appliedCount, newAppliedAt)
        ).hasMessage("수용인원을 초과하여 신청 불가");
    }

    @Test
    @DisplayName("교육 첨부파일은 교육 활성화/비활성화 상관없이 추가 가능하다.")
    void addEducationFile_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        String mimeType = "image/png";
        String originName = "originName";
        String extension = "png";
        long size = 1024L;

        education.addEducationFile(mimeType, originName, extension, size);

        assertThat(education.getEducationFiles())
                .as("비활성화 상태에서 파일을 추가할 수 있다.")
                .hasSize(1);

        assertThat(education.getEducationFiles())
                .singleElement().satisfies(f -> {
                assertThat(f).extracting(
                        EducationFile::getEducation, EducationFile::getMimeType,
                        EducationFile::getOriginalName, EducationFile::getExtension,
                        EducationFile::getFileSize
                ).containsExactly(
                        education, mimeType, originName, extension, size
                );
        });

        education.activate();
        education.addEducationFile(mimeType, originName, extension, size);

        assertThat(education.getEducationFiles()).as("활성화 상태에서 파일을 추가 할 수 있다.").hasSize(2);

    }

    @Test
    @Transactional
    @DisplayName("교육 첨부파일은 교육 활성화/비활성화 상관없이 삭제 가능하다.")
    void removeEducationFile_success() {
        Education education = Education.create(
                getApprovedEmp(), LocalDateTime.of(2026, 4, 5, 0, 0, 0), "testPlace", "testTitle", "testContent", 20L
        );

        education.addEducationFile("image/png", "originName", "png", 1024L);
        EducationFile targetFile = education.getEducationFiles().getFirst();
        ReflectionTestUtils.setField(targetFile, "id", 1L);

        education.removeEducationFile(targetFile.getId());
        assertThat(education.getEducationFiles())
                .as("비활성화 상태에서 파일을 삭제할 수 있다.")
                .isEmpty();

        education.addEducationFile("image/png", "originName", "png", 1024L);
        EducationFile targetFile2 = education.getEducationFiles().getFirst();
        ReflectionTestUtils.setField(targetFile2, "id", 1L);
        education.activate();

        education.removeEducationFile(targetFile2.getId());
        assertThat(education.getEducationFiles())
                .as("활성화 상태에서 파일을 삭제할 수 있다.")
                .isEmpty();
    }

}