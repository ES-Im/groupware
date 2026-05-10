package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dept extends AbstractEntity {

    private String deptCode;

    private String deptName;

    private boolean isActive;

    public static Dept registerDept(String deptCode, String deptName) {
        Dept dept = new Dept();

        dept.deptCode = requireNonNull(deptCode);
        dept.deptName = requireNonNull(deptName);
        dept.isActive = true;

        return dept;
    }

    public void activate() {
        state(!this.isActive, "이미 활성화된 부서입니다.");

        this.isActive = true;
    }

    public void deactivate() {
        state(this.isActive, "이미 비활성화된 부서입니다.");

        this.isActive = false;
    }

    public void renameDept(String newDeptName) {
        this.deptName = requireNonNull(newDeptName);
    }

}
