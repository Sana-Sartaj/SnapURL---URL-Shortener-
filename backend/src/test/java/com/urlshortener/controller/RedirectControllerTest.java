package com.urlshortener.controller;

import com.urlshortener.service.CacheService;
import com.urlshortener.service.RateLimitService;
import com.urlshortener.service.UrlService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RedirectController.class)
@DisplayName("RedirectController Tests")
class RedirectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private UrlService urlService;
    @MockBean private RateLimitService rateLimitService;
    @MockBean private CacheService cacheService;

    @Test
    @DisplayName("GET /{shortCode} returns 302 redirect to original URL")
    void shouldRedirectToOriginalUrl() throws Exception {
        when(urlService.resolveUrl(eq("aBcDe7K"), any(), any(), any()))
            .thenReturn("https://example.com/very/long/path");

        mockMvc.perform(get("/aBcDe7K"))
            .andExpect(status().isFound())
            .andExpect(header().string("Location", "https://example.com/very/long/path"))
            .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    @DisplayName("GET /{shortCode} rejects too-short codes immediately")
    void shouldRejectShortCodes() throws Exception {
        mockMvc.perform(get("/ab"))
            .andExpect(status().isNotFound());

        verify(urlService, never()).resolveUrl(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /preview/{shortCode} returns JSON preview")
    void shouldReturnPreview() throws Exception {
        when(urlService.resolveUrl(eq("aBcDe7K"), any(), any(), any()))
            .thenReturn("https://example.com");

        mockMvc.perform(get("/preview/aBcDe7K"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.shortCode").value("aBcDe7K"))
            .andExpect(jsonPath("$.destination").value("https://example.com"));
    }
}
