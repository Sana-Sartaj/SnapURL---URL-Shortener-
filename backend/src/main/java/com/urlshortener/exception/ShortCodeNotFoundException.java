package com.urlshortener.exception;

public class ShortCodeNotFoundException extends RuntimeException {
    private final String shortCode;

    public ShortCodeNotFoundException(String shortCode) {
        super("Short code not found: " + shortCode);
        this.shortCode = shortCode;
    }

    public String getShortCode() { return shortCode; }
}
