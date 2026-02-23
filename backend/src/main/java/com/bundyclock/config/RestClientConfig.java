package com.bundyclock.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        // TODO: Customize with timeouts, message converters for production
        return new RestTemplate();
    }
}
