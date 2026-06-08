package com.haruon.groupware.adapter.security;

import com.haruon.groupware.adapter.security.filter.JwtAuthFilter;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain oauthSecurityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));

        http
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                        })
                        .accessDeniedHandler((request, response, authException) -> {
                            response.sendError(HttpServletResponse.SC_FORBIDDEN);
                        })
                );

        http
                .authorizeHttpRequests((auth) -> auth

                        /* Public API*/
                        .requestMatchers("/", "/error", "/api/auth/login", "/api/auth/reissue").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/employees").permitAll()

                        /* Company API */
                        .requestMatchers(HttpMethod.GET, "/api/company").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/company", "/api/company/**").hasRole(SystemRoleCode.ADMIN.name())

                        /* Dept API */
                        .requestMatchers(HttpMethod.GET, "/api/departments", "/api/departments/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/departments/**").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.POST, "/api/departments/**").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/departments/**").hasRole(SystemRoleCode.ADMIN.name())

                        /* Employee - Manager API */
                        .requestMatchers(HttpMethod.GET, "/api/employees")
                                    .hasAnyRole(SystemRoleCode.HR.name(), SystemRoleCode.DEPT_MANAGER.name())

                        .requestMatchers(HttpMethod.PATCH,
                                "/api/employees/*/registration-approval",
                                "/api/employees/*/resignation",
                                "/api/employees/*/hr-managed-info",
                                "/api/employees/*/status/activation",
                                "/api/employees/*/status/suspension"
                        ).hasRole(SystemRoleCode.HR.name())

                        .requestMatchers(HttpMethod.PATCH,
                                "/api/employees/*/dept-managed-info"
                        ).hasRole(SystemRoleCode.DEPT_MANAGER.name())

                        /* Employee API */
                        .requestMatchers("/api/auth/logout", "/api/employees/**").hasRole(SystemRoleCode.EMPLOYEE.name())

                        /* ATTENDANCE API*/
                        .requestMatchers("/api/employees/attendances/me/**").authenticated()
                        .requestMatchers("/api/employees/attendances/**").hasRole(SystemRoleCode.DEPT_MANAGER.name())

                        /* EmpLeave API */
                        .requestMatchers(HttpMethod.GET, "/api/employees/me/leaves/summary").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/employees/*/leaves/special-grant-days").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/employees/*/leaves/compensatory-grant-days").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.GET, "/api/employees/leaves/summary").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.GET, "/api/employees/leaves/usage-summary").hasRole(SystemRoleCode.ADMIN.name())
                        .requestMatchers(HttpMethod.GET, "/api/departments/*/employees/leaves/summary").hasRole(SystemRoleCode.DEPT_MANAGER.name())
                        .requestMatchers(HttpMethod.GET, "/api/departments/*/employees/leaves/usage-summary").hasRole(SystemRoleCode.DEPT_MANAGER.name())

                        /* leave API*/
                        .requestMatchers("/api/leave/employees/me/**").authenticated()
                        .requestMatchers("/api/leave/departments/*/request-history").hasRole(SystemRoleCode.DEPT_MANAGER.name())

                        /* BusinessTrip API */
                        .requestMatchers("/api/businessTrip/employees/me/**").authenticated()
                        .requestMatchers("/api/businessTrip/departments/*/request-history").hasRole(SystemRoleCode.DEPT_MANAGER.name())

                        /* DocumentBox API */
                        .requestMatchers("/api/document-box/me/**").authenticated()

                        /* File API */
                        .requestMatchers(HttpMethod.GET,
                                "/api/drafts/*/files/**",
                                "/api/boards/*/files/**",
                                "/api/messages/*/files/**",
                                "/api/educations/*/files/**",
                                "/api/meeting-rooms/*/files/**"
                        ).hasAnyRole(SystemRoleCode.EMPLOYEE.name())

                        .anyRequest().authenticated());

        http
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public RoleHierarchy roleHierarchy() {

        return RoleHierarchyImpl.withRolePrefix("ROLE_")
                .role(SystemRoleCode.ADMIN.name()).implies(SystemRoleCode.DEPT_MANAGER.name())
                .role(SystemRoleCode.ADMIN.name()).implies(SystemRoleCode.HR.name())
                .role(SystemRoleCode.ADMIN.name()).implies(SystemRoleCode.EMPLOYEE.name())
                .role(SystemRoleCode.DEPT_MANAGER.name()).implies(SystemRoleCode.EMPLOYEE.name())

                .role(SystemRoleCode.HR.name()).implies(SystemRoleCode.EMPLOYEE.name())
                .role(SystemRoleCode.IT.name()).implies(SystemRoleCode.EMPLOYEE.name())
                .role(SystemRoleCode.FACILITY.name()).implies(SystemRoleCode.EMPLOYEE.name())
                .role(SystemRoleCode.FRANCHISE.name()).implies(SystemRoleCode.EMPLOYEE.name())

                .build();
    }

    @Bean
    public PasswordEncoder securityPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
