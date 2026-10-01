package com.example.backend_spring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class BackendSpringApplication {

	private static final Logger log = LoggerFactory.getLogger(BackendSpringApplication.class);

	public static void main(String[] args) {
		ConfigurableApplicationContext context =
				SpringApplication.run(BackendSpringApplication.class, args);

		if (context instanceof ServletWebServerApplicationContext webContext) {
			Environment environment = context.getEnvironment();
			int port = webContext.getWebServer().getPort();
			String contextPath = normalizePath(environment.getProperty("server.servlet.context-path", ""));
			String swaggerPath = normalizePath(
					environment.getProperty("springdoc.swagger-ui.path", "/swagger-ui.html"));
			String apiDocsPath = normalizePath(
					environment.getProperty("springdoc.api-docs.path", "/v3/api-docs"));
			String baseUrl = "http://localhost:" + port + contextPath;

			log.info("""

					----------------------------------------------------------
					Backend     : {}
					Swagger UI  : {}{}
					OpenAPI JSON: {}{}
					----------------------------------------------------------""",
					baseUrl, baseUrl, swaggerPath, baseUrl, apiDocsPath);
		}
	}

	private static String normalizePath(String path) {
		if (path == null || path.isBlank() || "/".equals(path)) {
			return "";
		}
		String normalized = path.startsWith("/") ? path : "/" + path;
		return normalized.endsWith("/")
				? normalized.substring(0, normalized.length() - 1)
				: normalized;
	}
}
