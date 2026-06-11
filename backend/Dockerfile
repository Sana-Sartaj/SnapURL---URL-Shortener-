# =============================================
# Multi-stage Dockerfile for URL Shortener Backend
# Production-optimized for AWS EC2 t3.micro (2GB RAM)
# =============================================

# ── Stage 1: Build ────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy dependency files first (Docker layer cache optimization)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
RUN chmod +x mvnw

# Download dependencies (cached if pom.xml unchanged)
RUN ./mvnw dependency:go-offline -q

# Copy source and build
COPY src/ src/
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Create non-root user (security best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy JAR from build stage
COPY --from=builder /build/target/url-shortener-*.jar app.jar

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# JVM flags tuned for t3.micro (2GB RAM):
# -Xms256m: Start with 256MB heap (don't grab memory until needed)
# -Xmx512m: Cap at 512MB (leave room for OS + Redis + PostgreSQL)
# -XX:+UseG1GC: G1 GC for low-latency pauses
# -XX:MaxGCPauseMillis=100: Target GC pauses < 100ms
# -XX:+UseStringDeduplication: Save memory on repeated URL strings
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UseStringDeduplication -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
