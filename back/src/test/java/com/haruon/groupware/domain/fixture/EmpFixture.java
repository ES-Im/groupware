package com.haruon.groupware.domain.fixture;

import com.haruon.groupware.domain.empInfo.Dept;

public class EmpFixture {

    public static Dept getDept() {
        return Dept.registerDept( "00001", "testDept");
    }

    public static Dept getDept(String setDeptName) {
        return Dept.registerDept( "00001", setDeptName);
    }
}
