package com.haruon.groupware.adapter.docs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.haruon.groupware.adapter.exception.GlobalExceptionHandler;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.employee.account.service.query.dto.BelongingInfo;
import com.haruon.groupware.domain.employee.enums.EmpStatus;
import com.haruon.groupware.domain.employee.enums.PositionCode;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.restdocs.RestDocumentationContextProvider;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.context.SecurityContextPersistenceFilter;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.documentationConfiguration;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

@ExtendWith(RestDocumentationExtension.class)
public abstract class RestDocsSupport {

    protected MockMvc mockMvc;
    protected ObjectMapper objectMapper = JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .build();

    @BeforeEach
    void setUp(RestDocumentationContextProvider provider) {
        this.mockMvc = MockMvcBuilders.standaloneSetup(initControllers())
                .setMessageConverters(
                        new StringHttpMessageConverter(StandardCharsets.UTF_8),
                        new MappingJackson2HttpMessageConverter(objectMapper),
                        new ResourceHttpMessageConverter()
                )
                .setControllerAdvice(GlobalExceptionHandler.class)
                .setCustomArgumentResolvers(
                        new AuthenticationPrincipalArgumentResolver(),
                        new PageableHandlerMethodArgumentResolver()
                )
                .addFilters(new SecurityContextPersistenceFilter())
                .apply(documentationConfiguration(provider))
                .build();

    }

    protected Object[] initControllers() {
        return new Object[]{initController()};
    }

    protected Object initController() {
        throw new UnsupportedOperationException("initController() or initControllers() must be implemented");
    }

    protected RequestPostProcessor employeeAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "employee",
                "password",
                List.of(SystemRoleCode.EMPLOYEE),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }

    protected RequestPostProcessor hrAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "hr",
                "password",
                List.of(SystemRoleCode.HR),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }

    protected RequestPostProcessor deptManagerAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "deptManager",
                "password",
                List.of(SystemRoleCode.DEPT_MANAGER),
                List.of(new BelongingInfo(1L, "001", "IT", PositionCode.ASSISTANT_MANAGER, true, LocalDate.of(2026,1,1), null)),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }

    protected RequestPostProcessor franchiseAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "franchise",
                "password",
                List.of(SystemRoleCode.FRANCHISE),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }
}
