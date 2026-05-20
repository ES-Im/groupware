package com.haruon.groupware.adapter.security.empDtails;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmpDetailsService implements UserDetailsService {

    private final EmpRepository empRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(
            String loginId
    ) throws UsernameNotFoundException {
        Emp emp = empRepository.findByLoginIdAndStatus(loginId, EmpStatus.ACTIVE)
                .orElseThrow(() -> new UsernameNotFoundException("Emp not found"));

        return EmpDetails.from(emp);
    }

}
