package com.haruon.groupware.domain.franchise;

public class franchiseFixture {

    public static Franchise getFranchise() {

        return Franchise.create("1234567890", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);
    }
}
