package com.urlshortener.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;

@DisplayName("SnowflakeIdGenerator Tests")
class SnowflakeIdGeneratorTest {

    private SnowflakeIdGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new SnowflakeIdGenerator(1L);
    }

    @Test
    @DisplayName("Generated IDs are positive")
    void shouldGeneratePositiveIds() {
        long id = generator.nextId();
        assertThat(id).isPositive();
    }

    @Test
    @DisplayName("Sequential IDs are monotonically increasing")
    void shouldBeMonotonicallyIncreasing() {
        long id1 = generator.nextId();
        long id2 = generator.nextId();
        long id3 = generator.nextId();
        assertThat(id2).isGreaterThan(id1);
        assertThat(id3).isGreaterThan(id2);
    }

    @Test
    @DisplayName("No duplicates across 100,000 sequential IDs")
    void shouldGenerateUniqueIds_Sequential() {
        int count = 100_000;
        Set<Long> ids = new HashSet<>(count);
        for (int i = 0; i < count; i++) {
            long id = generator.nextId();
            assertThat(ids.add(id))
                .as("Duplicate ID found at iteration %d: %d", i, id)
                .isTrue();
        }
        assertThat(ids).hasSize(count);
    }

    @Test
    @DisplayName("No duplicates across 10,000 concurrent IDs (thread-safety)")
    void shouldGenerateUniqueIds_Concurrent() throws Exception {
        int threads = 10;
        int idsPerThread = 1000;
        int total = threads * idsPerThread;

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        ConcurrentLinkedQueue<Long> ids = new ConcurrentLinkedQueue<>();

        CountDownLatch latch = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) {
            executor.submit(() -> {
                try {
                    for (int i = 0; i < idsPerThread; i++) {
                        ids.add(generator.nextId());
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        Set<Long> unique = new HashSet<>(ids);
        assertThat(unique).hasSize(total);
    }

    @Test
    @DisplayName("Base62 encoding produces 7-character codes")
    void shouldEncodeToSevenCharBase62() {
        String code = generator.generateShortCode();
        assertThat(code).hasSize(7);
        assertThat(code).matches("[0-9A-Za-z]{7}");
    }

    @Test
    @DisplayName("Base62 encoding is deterministic and decodable")
    void shouldRoundTripBase62() {
        long id = generator.nextId();
        String encoded = Base62Encoder.encode(id);
        long decoded = Base62Encoder.decode(encoded);
        assertThat(decoded).isEqualTo(id);
    }

    @Test
    @DisplayName("Invalid machine ID throws exception")
    void shouldRejectInvalidMachineId() {
        assertThatThrownBy(() -> new SnowflakeIdGenerator(-1L))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new SnowflakeIdGenerator(1024L))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Short codes from different IDs are unique")
    void shortCodesShouldBeUnique() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 10_000; i++) {
            String code = generator.generateShortCode();
            assertThat(codes.add(code))
                .as("Duplicate short code: %s", code)
                .isTrue();
        }
    }

    @Test
    @DisplayName("Base62 isValidShortCode validates correctly")
    void shouldValidateShortCodes() {
        assertThat(Base62Encoder.isValidShortCode("abc1234")).isTrue();
        assertThat(Base62Encoder.isValidShortCode("AAAAAAA")).isTrue();
        assertThat(Base62Encoder.isValidShortCode("abc123")).isFalse();   // 6 chars
        assertThat(Base62Encoder.isValidShortCode("abc12345")).isFalse(); // 8 chars
        assertThat(Base62Encoder.isValidShortCode("abc!234")).isFalse();  // special char
        assertThat(Base62Encoder.isValidShortCode(null)).isFalse();
    }
}
