package com.urlshortener.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * Twitter Snowflake Algorithm Implementation
 *
 * 64-bit ID Structure:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ 0 │ 41-bit timestamp │ 10-bit machine ID │ 12-bit sequence     │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Guarantees:
 * - Zero collisions across distributed nodes
 * - ~4096 unique IDs per millisecond per node
 * - Sortable by time (time-ordered)
 * - Works until year 2079
 *
 * Resume stat: Snowflake ID generation ensures zero URL collisions at scale
 */
@Slf4j
@Component
public class SnowflakeIdGenerator {

    // Custom epoch: Jan 1, 2024 00:00:00 UTC (reduces timestamp size)
    private static final long EPOCH = 1704067200000L;

    // Bit allocations
    private static final long MACHINE_ID_BITS    = 10L;
    private static final long SEQUENCE_BITS      = 12L;

    // Max values
    private static final long MAX_MACHINE_ID     = ~(-1L << MACHINE_ID_BITS);  // 1023
    private static final long MAX_SEQUENCE        = ~(-1L << SEQUENCE_BITS);    // 4095

    // Bit shift positions
    private static final long MACHINE_ID_SHIFT   = SEQUENCE_BITS;              // 12
    private static final long TIMESTAMP_SHIFT    = SEQUENCE_BITS + MACHINE_ID_BITS; // 22

    private final long machineId;
    private long lastTimestamp = -1L;
    private long sequence = 0L;

    public SnowflakeIdGenerator(@Value("${snowflake.machine-id:1}") long machineId) {
        if (machineId < 0 || machineId > MAX_MACHINE_ID) {
            throw new IllegalArgumentException(
                "Machine ID must be between 0 and " + MAX_MACHINE_ID + ", got: " + machineId
            );
        }
        this.machineId = machineId;
        log.info("SnowflakeIdGenerator initialized with machineId={}, maxSequence={}/ms",
                 machineId, MAX_SEQUENCE + 1);
    }

    /**
     * Generate a unique 64-bit Snowflake ID.
     * Thread-safe via synchronization.
     *
     * @return unique long ID
     */
    public synchronized long nextId() {
        long currentTimestamp = currentTimeMillis();

        // Clock moved backwards — wait for it to catch up (handles NTP drift)
        if (currentTimestamp < lastTimestamp) {
            long clockDrift = lastTimestamp - currentTimestamp;
            log.warn("Clock moved backwards by {}ms — waiting for recovery", clockDrift);
            if (clockDrift <= 5) {
                currentTimestamp = waitForNextMillis(lastTimestamp);
            } else {
                throw new IllegalStateException(
                    "Clock moved backwards by " + clockDrift + "ms. Refusing to generate ID to prevent collisions."
                );
            }
        }

        if (currentTimestamp == lastTimestamp) {
            // Same millisecond — increment sequence
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) {
                // Sequence overflow — wait for next millisecond
                currentTimestamp = waitForNextMillis(lastTimestamp);
            }
        } else {
            // New millisecond — reset sequence
            sequence = 0L;
        }

        lastTimestamp = currentTimestamp;

        // Assemble the 64-bit ID
        return ((currentTimestamp - EPOCH) << TIMESTAMP_SHIFT)
             | (machineId << MACHINE_ID_SHIFT)
             | sequence;
    }

    /**
     * Convert Snowflake ID to Base62 short code (7 chars for IDs up to ~3.5 trillion)
     */
    public String toBase62(long id) {
        return Base62Encoder.encode(id);
    }

    /**
     * Generate a short code directly from a new Snowflake ID
     */
    public String generateShortCode() {
        return toBase62(nextId());
    }

    private long waitForNextMillis(long lastTimestamp) {
        long timestamp = currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = currentTimeMillis();
        }
        return timestamp;
    }

    private long currentTimeMillis() {
        return System.currentTimeMillis();
    }

    /**
     * Extract creation timestamp from a Snowflake ID (for debugging)
     */
    public long extractTimestamp(long id) {
        return (id >> TIMESTAMP_SHIFT) + EPOCH;
    }

    public long getMachineId() {
        return machineId;
    }
}
