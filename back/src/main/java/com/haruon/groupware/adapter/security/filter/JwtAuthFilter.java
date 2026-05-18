package com.haruon.groupware.adapter.security.filter;

import com.haruon.groupware.adapter.security.empDtails.EmpDetailsService;
import com.haruon.groupware.application.auth.required.TokenParser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final TokenParser tokenParser;
    private final EmpDetailsService empDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        String bearerPrefix = "Bearer ";
        if (authorization == null || !authorization.startsWith(bearerPrefix)) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = authorization.substring(bearerPrefix.length());
        boolean isValidAccessToken = tokenParser.isValidToken(accessToken, true);

        if (!isValidAccessToken) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            String loginId = tokenParser.getLoginId(accessToken);
            UserDetails empDetails = empDetailsService.loadUserByUsername(loginId);

            UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.authenticated(
                    empDetails,
                    null,
                    empDetails.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (UsernameNotFoundException e) {
            SecurityContextHolder.clearContext();

            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/auth/login") || path.equals("/api/auth/reissue");
    }
}
