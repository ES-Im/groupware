package com.haruon.groupware.domain.empInfo;

import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static com.haruon.groupware.domain.empInfo.EmpLeave.createEmpLeave;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmpLeaveTest {

    @Test
    @DisplayName("연차엔티티 생성 테스트")
    void create_EmpAnnual_Leave_success() {
        Emp emp = getApprovedEmp();
        int GrantedYear = 2026;
        double annualGrantDays = 15.0;

        EmpLeave empLeave = createEmpLeave(
                emp,
                GrantedYear,
                annualGrantDays
        );

        assertThat(empLeave).extracting(
            "emp", "grantYear",
                "annualBaseGrantDays", "annualUsedDays",
                "specialGrantDays", "specialUsedDays",
                "compensatoryGrantDays", "compensatoryUsedDays"
        ).containsExactly(
            emp, GrantedYear,
                annualGrantDays, 0.0,
                0.0, 0.0,
                0.0, 0.0
        );

    }

    private static Stream<Arguments>  createEmpAnnualFailPrams() {
        Emp emp = getApprovedEmp();
        int GrantedYear = 2026;
        double annualGrantDays = 15.0;

        return Stream.of(
                Arguments.of("사원정보가 없으면",
                        CreateLeaveParam.builder()
                                .emp(null)
                                .annualBaseGrantDays(annualGrantDays)
                                .grantYear(GrantedYear)
                        .build()
                ),Arguments.of("부여일수가 음수라면",
                        CreateLeaveParam.builder()
                                .emp(emp)
                                .annualBaseGrantDays(-1.0)
                                .grantYear(GrantedYear)
                        .build()
                ),Arguments.of("부여연도가 없으면",
                        CreateLeaveParam.builder()
                                .emp(emp)
                                .annualBaseGrantDays(annualGrantDays)
                                .grantYear(null)
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0} 연차 엔티티 생성에 실패한다.")
    @DisplayName("연차 엔티티 생성 실패 케이스")
    @MethodSource("createEmpAnnualFailPrams")
    void createLeave_fail_cases(String description, CreateLeaveParam param) {
        assertThatThrownBy(() ->
            createEmpLeave(
                    param.emp(),
                    param.grantYear(),
                    param.annualBaseGrantDays()
            )
        ).isInstanceOf(Exception.class);
    }

    @Builder
    private record CreateLeaveParam(
            Emp emp,
            Integer grantYear,
            double annualBaseGrantDays
    ) {}

    @Test
    @DisplayName("특별휴가 조정 성공 케이스")
    void adjust_special_grant_day_success() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustSpecialGrantDays(1.0);

        assertThat(empLeave.getSpecialGrantDays()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("특별휴가 조정 실패 케이스")
    void adjust_special_grant_day_fail() {
        EmpLeave empLeave = getEmpLeave();

        assertThatThrownBy(() ->
                empLeave.adjustSpecialGrantDays(-1.0)
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("대체휴무 조정 성공 케이스")
    void adjust_Compensatory_grant_day_success() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustCompensatoryGrantDays(1.0);

        assertThat(empLeave.getCompensatoryGrantDays()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("대체휴무 조정 실패 케이스")
    void adjust_Compensatory_grant_day_fail() {
        EmpLeave empLeave = getEmpLeave();

        assertThatThrownBy(() ->
                empLeave.adjustCompensatoryGrantDays(-1.0)
        ).isInstanceOf(Exception.class);
    }
    
    @Test
    @DisplayName("연차 사용 성공 케이스")
    void useAnnualDays_success() {
        EmpLeave empLeave = getEmpLeave();
        Double annualBaseGrantDays = empLeave.getAnnualBaseGrantDays();
        double usedDays = annualBaseGrantDays - 1.0;

        empLeave.useAnnualDays(usedDays);

        assertThat(empLeave.getAnnualUsedDays()).isEqualTo(usedDays);
    }

    @Test
    @DisplayName("연차 사용 실패 케이스")
    void useAnnualDays_fail() {
        EmpLeave empLeave = getEmpLeave();
        Double annualBaseGrantDays = empLeave.getAnnualBaseGrantDays();
        double usedDays = annualBaseGrantDays + 1.0;

        assertThatThrownBy(() ->
                empLeave.useAnnualDays(usedDays)
        ).isInstanceOf(Exception.class);
    }
    
    @Test
    @DisplayName("특휴 사용 성공 케이스")
    void useSpecialDays_success() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustSpecialGrantDays(5);

        double usedDays = empLeave.getSpecialGrantDays() - 1.0;

        empLeave.useSpecialDays(usedDays);

        assertThat(empLeave.getSpecialUsedDays()).isEqualTo(usedDays);
    }

    @Test
    @DisplayName("특휴 사용 실패 케이스")
    void useSpecialDays_fail() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustSpecialGrantDays(5);

        double usedDays = empLeave.getSpecialGrantDays() + 1.0;

        assertThatThrownBy(() ->
                empLeave.useSpecialDays(usedDays)
        ).isInstanceOf(Exception.class);
    }
    @Test
    @DisplayName("대휴 사용 성공 케이스")
    void useCompensatoryDays_success() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustCompensatoryGrantDays(5);

        double usedDays = empLeave.getCompensatoryGrantDays() - 1.0;

        empLeave.useCompensatoryDays(usedDays);

        assertThat(empLeave.getCompensatoryUsedDays()).isEqualTo(usedDays);
    }

    @Test
    @DisplayName("대휴 사용 실패 케이스")
    void useCompensatoryDays_fail() {
        EmpLeave empLeave = getEmpLeave();
        empLeave.adjustCompensatoryGrantDays(5);

        double usedDays = empLeave.getCompensatoryGrantDays() + 1.0;

        assertThatThrownBy(() ->
                empLeave.useCompensatoryDays(usedDays)
        ).isInstanceOf(Exception.class);
    }

    private EmpLeave getEmpLeave() {
        Emp emp = getApprovedEmp();
        int GrantedYear = 2026;
        double annualGrantDays = 15.0;

        return createEmpLeave(
                emp,
                GrantedYear,
                annualGrantDays
        );
    }

}