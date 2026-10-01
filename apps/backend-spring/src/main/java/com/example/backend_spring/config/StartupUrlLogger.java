package com.example.backend_spring.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
public class StartupUrlLogger implements ApplicationListener<WebServerInitializedEvent> {

    private static final Logger LOGGER = LoggerFactory.getLogger(StartupUrlLogger.class);

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${springdoc.swagger-ui.path:/swagger-ui.html}")
    private String swaggerUiPath;

    @Override
    public void onApplicationEvent(WebServerInitializedEvent event) {
        int port = event.getWebServer().getPort();
        String normalizedContextPath = normalizePath(contextPath);
        String normalizedSwaggerPath = normalizePath(swaggerUiPath);

        LOGGER.info("Backend is running at: http://localhost:{}{}", port, normalizedContextPath);
        LOGGER.info("Swagger UI: http://localhost:{}{}{}", port, normalizedContextPath, normalizedSwaggerPath);
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return "";
        }
        return path.startsWith("/") ? path : "/" + path;
    }
}
