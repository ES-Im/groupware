package com.haruon.groupware.adapter.security.empDtails;

import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * username = loginId
 */
public class EmpDetails implements UserDetails {

    private final String loginId;
    private final String password;
    private final List<SystemRoleCode> roles;
    @Getter private final List<BelongingInfo> belongings;
    @Getter private final EmpStatus status;

    public EmpDetails(
            String loginId,
            String password,
            List<SystemRoleCode> roles,
            List<BelongingInfo> belongings,
            EmpStatus status
    ) {
        this.loginId = loginId;
        this.password = password;
        this.roles = roles;
        this.belongings = belongings;
        this.status = status;
    }

    public static EmpDetails from(Emp emp) {
        return new EmpDetails(
                emp.getLoginId(),
                emp.getEmpPassword(),
                emp.getSystemRoles().stream().toList(),
                emp.getEmpBelongings().stream()
                        .filter(belonging -> belonging.getEndAt() == null)
                        .map(b -> new BelongingInfo(
                                b.getId(),
                                b.getDept().getDeptName(),
                                b.getPosition(),
                                b.isPrimary(),
                                null, null
                        )).toList(),
                emp.getStatus()
        );
    }

    @Override
    public String getUsername() {
        return loginId;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();
    }

    @Override
    public boolean isEnabled() {
        return status == EmpStatus.ACTIVE;
    }

}
