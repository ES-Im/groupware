package com.haruon.groupware.domain.franchise;

public class franchiseFixture {

    public static Franchise getFranchise() {

        return Franchise.create("123456789", "테스트강남점", "인천광역시 부평구", "테스트", "010-1234-5678", "test@gmail.com", null);
    }
}
