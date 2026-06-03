package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.franchise.EducationRegisterMismatchException;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record EducationManagementTest(
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        EducationRepository educationRepository,
        EducationManagement educationManagement,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        educationRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }


    @Test
    @DisplayName("가맹점 권한이 있는 사원은 가맹점 대상 교육을 등록할 수 있다.")
    void createEducation_by_emp_who_has_franchiseRole_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        LocalDateTime educationDate = LocalDateTime.of(2026, 5, 1, 9, 0, 0);
        String place = "테스트 강남점";
        String title = "테스트타이틀";
        String content = "테스트교육내용";
        long capacity = 20L;

        long education = educationManagement.createEducation(
                franchiseEmp.getId(),
                EducationCreateRequest.builder()
                        .educationDate(educationDate)
                        .place(place)
                        .title(title)
                        .content(content)
                        .capacity(capacity)
                        .build()
        );

        Education foundEducation = educationRepository.findById(education).orElseThrow();

        assertThat(foundEducation).extracting(
                Education::getEducationDate,
                Education::getPlace,
                Education::getTitle,
                Education::getContent,
                Education::getCapacity
        ).containsExactly(
                educationDate, place, title, content, capacity
        );

        assertThat(foundEducation.isActive())
                .as("교육 초기 활성화 여부는 false(비활성화) 이다")
                .isFalse();
    }

    @Test
    @DisplayName("교육 등록사원은 가맹점 대상 교육을 수정할 수 있다.")
    void updateEducation_by_register_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");

        long education = getEducation(franchiseEmp);

        LocalDateTime newEducationDate = LocalDateTime.of(2026, 5, 2, 9, 0, 0);
        String newPlace = "edit테스트 강남점";
        String newTitle = "edit 테스트타이틀";
        String newContent = "edit 테스트교육내용";
        long newCapacity = 30L;

        educationManagement.updateEducation(
                education,
                franchiseEmp.getId(),
                EducationUpdateRequest.builder()
                        .educationDate(newEducationDate)
                        .place(newPlace)
                        .title(newTitle)
                        .content(newContent)
                        .capacity(newCapacity)
                        .build()
        );

        Education foundEducation = educationRepository.findById(education).orElseThrow();
        assertThat(foundEducation).extracting(
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
    @DisplayName("교육 등록사원이 아닌 사원은 가맹점 대상 교육을 수정할 수 없다.")
    void updateEducation_by_not_register_fail() {
        Emp register = getFranchiseEmp("202601001", "franchise1");
        Emp other = getFranchiseEmp("202601002", "franchise2");

        long education = getEducation(register);

        assertThatThrownBy(() ->
                educationManagement.updateEducation(
                        education,
                        other.getId(),
                        EducationUpdateRequest.builder()
                                .educationDate(LocalDateTime.of(2026, 5, 2, 9, 0, 0))
                                .place("edit테스트 강남점")
                                .title("edit 테스트타이틀")
                                .content("edit 테스트교육내용")
                                .capacity(30L)
                                .build()
                )
        ).isInstanceOf(EducationRegisterMismatchException.class);

    }

    @Test
    @DisplayName("교육 등록 사원은 교육을 활성화할 수 있다")
    void activate_education_by_register_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        long education = getEducation(franchiseEmp);
        educationManagement.activate(education, franchiseEmp.getId());

        Education foundEducation = educationRepository.findById(education).orElseThrow();
        assertThat(foundEducation.isActive()).isTrue();
    }

    @Test
    @DisplayName("교육 등록 사원은 교육을 비활성화할 수 있다")
    void deactivate_education_by_register_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        long education = getEducation(franchiseEmp);

        educationManagement.activate(education, franchiseEmp.getId());
        educationManagement.deactivate(education, franchiseEmp.getId());

        Education foundEducation = educationRepository.findById(education).orElseThrow();
        assertThat(foundEducation.isActive()).isFalse();
    }

    private long getEducation(Emp franchiseEmp) {
        return educationManagement.createEducation(
                franchiseEmp.getId(),
                EducationCreateRequest.builder()
                        .educationDate(LocalDateTime.of(2026, 5, 1, 9, 0, 0))
                        .place("테스트 강남점")
                        .title("테스트타이틀")
                        .content("테스트교육내용")
                        .capacity(20L)
                        .build()
        );
    }

    private Emp getFranchiseEmp(String empNo, String loginId) {
        return getSavedFranchiseEmp(deptRepository, empRepository, empNo, loginId);
    }

}
