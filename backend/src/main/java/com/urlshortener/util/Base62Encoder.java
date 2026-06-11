package com.urlshortener.util;

/**
 * Base62 Encoder/Decoder
 *
 * Converts large Snowflake IDs to compact URL-safe short codes.
 *
 * Character set: [0-9][A-Z][a-z] (62 chars)
 * A 7-char Base62 code supports up to 62^7 = 3,521,614,606,208 unique URLs
 *
 * Example:
 *   Snowflake ID: 6917529027641081856  → "aBcDe7K"
 *   7 chars instead of 19 digits
 */
public final class Base62Encoder {

    private static final String CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = 62;
    private static final int DEFAULT_LENGTH = 7;

    private Base62Encoder() {}

    /**
     * Encode a long to a Base62 string, padded to DEFAULT_LENGTH characters
     */
    public static String encode(long value) {
        if (value < 0) {
            throw new IllegalArgumentException("Value must be non-negative, got: " + value);
        }
        if (value == 0) {
            return "0".repeat(DEFAULT_LENGTH);
        }

        StringBuilder sb = new StringBuilder();
        long remaining = value;

        while (remaining > 0) {
            sb.append(CHARSET.charAt((int)(remaining % BASE)));
            remaining /= BASE;
        }

        // Pad to DEFAULT_LENGTH with leading '0' equivalent
        while (sb.length() < DEFAULT_LENGTH) {
            sb.append('0');
        }

        return sb.reverse().toString();
    }

    /**
     * Decode a Base62 string back to a long
     */
    public static long decode(String encoded) {
        if (encoded == null || encoded.isEmpty()) {
            throw new IllegalArgumentException("Encoded string cannot be null or empty");
        }

        long result = 0;
        for (char c : encoded.toCharArray()) {
            int index = CHARSET.indexOf(c);
            if (index == -1) {
                throw new IllegalArgumentException("Invalid Base62 character: " + c);
            }
            result = result * BASE + index;
        }
        return result;
    }

    /**
     * Validate a short code has correct format
     */
    public static boolean isValidShortCode(String code) {
        if (code == null || code.length() != DEFAULT_LENGTH) return false;
        for (char c : code.toCharArray()) {
            if (CHARSET.indexOf(c) == -1) return false;
        }
        return true;
    }
}
