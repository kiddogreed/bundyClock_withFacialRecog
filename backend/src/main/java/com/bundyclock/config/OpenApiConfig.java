package com.bundyclock.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bundyClockOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("BundyClock API")
                .description("Time In/Out attendance system with face recognition")
                .version("1.0.0")
                .contact(new Contact().name("BundyClock Dev Team")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local Dev"),
                new Server().url("https://api.bundyclock.com").description("Production")
            ));
    }
}
