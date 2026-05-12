package com.haruon.groupware.application.empInfo.batch;

public class AnnualLeaveGrantJob {


//    // to-do 배치 처리 대상 메서드 : RESIGNED 제외 필터링 필요
//    public int grantAnnualLeaveForNewYear(List<Emp> empList, LocalDate grantedDate) {
//        requireNonNull(empList, "사원 목록은 null일 수 없음");
//        state(!empList.isEmpty(), "사원 목록은 빈값이 될 수 없음");
//        requireNonNull(grantedDate, "연차 부여일은 null일 수 없음");
//
//        int grantedYear = grantedDate.getYear();
//
//        List<EmpLeave> empLeaves = new ArrayList<>();
//
//        empList.forEach(emp -> {
//            double grantedLeaveDays = calculateTotalLeaveDays(companyPolicyPort, emp, grantedDate);
//            empLeaves.add(createEmpLeave(emp, grantedYear, grantedLeaveDays));
//        });
//
//        if (empLeaves.isEmpty()) return 0;
//
//        return empLeaveRepository.saveAll(empLeaves).size();
//    }


}

// to-do 배치를 위한 회원 조회 로직을 만들면 각 연차별 테스트 코드 아래 참고할것
//    private static Stream<Arguments> empServiceCases() {
//        LocalDate grantYear = LocalDate.of(2026, 1, 1);
//
//        LocalDate hireDateUnderOneYearCase1 = LocalDate.of(2025, 11, 5);
//        LocalDate hireDateUnderOneYearCase2 = LocalDate.of(2025, 1, 2);
//        LocalDate hireDateUnderTwoYears = LocalDate.of(2023, 12, 31);
//        LocalDate hireDateUnderFourthYears = LocalDate.of(2021, 12, 31);
//        LocalDate hireDateUnderFiveYears = LocalDate.of(2020, 12, 31);
//        LocalDate hireDateOverTwentyYears = LocalDate.of(1990, 12, 31);
//
//
//        return Stream.of(
//                Arguments.of("1년 미만 직원은 1개월 개근 시 1일 연차 부여를 부여한다."
//                        ,calculateServicePeriod(hireDateUnderOneYearCase1, grantYear)
//                        , hireDateUnderOneYearCase1, 1.0),
//
//                Arguments.of("1년 미만인 사원은 연차를 최대 11일를 부여할 수 있다."
//                        ,calculateServicePeriod(hireDateUnderOneYearCase2, grantYear)
//                        , hireDateUnderOneYearCase2, 11.0),
//
//                Arguments.of("2년차까지는 최대 연차는 15일."
//                        , calculateServicePeriod(hireDateUnderTwoYears, grantYear)
//                        , hireDateUnderTwoYears, 15.0),
//
//                Arguments.of("3년차부터는 매 2년 마다 1일의 연차를 추가"
//                        ,  calculateServicePeriod(hireDateUnderFourthYears, grantYear)
//                        , hireDateUnderFourthYears, 16.0),
//
//                Arguments.of("5년차라면 2일의 연차가 추가"
//                        , calculateServicePeriod(hireDateUnderFiveYears, grantYear)
//                        , hireDateUnderFiveYears, 17.0),
//
//                Arguments.of("총 연차는 25일을 초과할 수 없음"
//                        , calculateServicePeriod(hireDateOverTwentyYears, grantYear)
//                        , hireDateOverTwentyYears, 25.0)
//        );
//    }
//    @ParameterizedTest(name = "{index} : 근속연수 = ''{1}'' ==> {0}")
//    @DisplayName("근속기간 별 연차 테스트")
//    @MethodSource("empServiceCases")
//    void createEmpAnnualLeave_success(String description, String servicePeriod, LocalDate hiredAt, Double expected) {
//        Emp emp = getApprovedEmp();
//
//        ReflectionTestUtils.setField(emp, "hiredAt", hiredAt);
//        Integer grantYear = 2026;
//
//        EmpAnnualLeave empAnnualLeave = createEmpAnnualLeave(emp, grantYear);
//
//        assertThat(empAnnualLeave).extracting(
//                "grantYear", "baseGrantDays", "additionalGrantDays", "usedDays"
//        ).containsExactly(grantYear, expected, 0.0, 0.0);
//
//    }
//
//private static String calculateServicePeriod(LocalDate hiredAt, LocalDate base) {
//    Period diff = Period.between(hiredAt, base);
//    int yearsOfService = diff.getYears();
//    long completedMonths = diff.getMonths();
//
//    return String.format("%02d년 %02d개월 근속", yearsOfService, completedMonths);
//}