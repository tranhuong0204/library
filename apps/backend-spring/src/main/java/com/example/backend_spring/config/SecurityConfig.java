package com.example.backend_spring.config;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.repository.UserRepository;
import com.example.backend_spring.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    String allowedOrigins = System.getenv().getOrDefault(
                            "CORS_ALLOWED_ORIGINS",
                            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000");
                    config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                            .map(String::trim).filter(origin -> !origin.isEmpty()).toList());
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setExposedHeaders(List.of("X-Download-Count", "Content-Disposition"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public APIs
                        .requestMatchers(
                                "/api/health",
                                "/api/auth/**",
                                "/api/documents/ai-sync",
                                "/api/documents/resolve-titles",
                                "/api/documents/search-ai",
                                "/api/documents/count-ai",
                                "/uploads/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Admin APIs
                        .requestMatchers("/api/admin", "/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/analytics", "/api/analytics/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/documents").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/documents/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/documents/{id:\\d+}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/groups").hasRole("ADMIN")

                        // Các API còn lại bắt buộc đăng nhập
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtService, userRepository),
                        UsernamePasswordAuthenticationFilter.class
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }

    private static class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtService jwtService;
        private final UserRepository userRepository;

        public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
            this.jwtService = jwtService;
            this.userRepository = userRepository;
        }

        @Override
        protected void doFilterInternal(
                HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain
        ) throws ServletException, IOException {

            if (HttpMethod.OPTIONS.matches(request.getMethod())) {
                filterChain.doFilter(request, response);
                return;
            }

            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            try {
                String token = authHeader.substring(7);
                String username = jwtService.extractUsername(token);

                if (username == null || username.isBlank()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                Optional<User> userOptional = userRepository.findByUsername(username);

                if (userOptional.isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                User user = userOptional.get();

                if (Boolean.FALSE.equals(user.getActive())) {
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<SimpleGrantedAuthority> authorities = isAdmin(user)
                            ? List.of(
                            new SimpleGrantedAuthority("ROLE_ADMIN"),
                            new SimpleGrantedAuthority("ROLE_USER")
                    )
                            : List.of(new SimpleGrantedAuthority("ROLE_USER"));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    authorities
                            );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }

            filterChain.doFilter(request, response);
        }

        private boolean isAdmin(User user) {
            return user != null && com.example.backend_spring.enums.Role.ADMIN.equals(user.getRole());
        }
    }
}
