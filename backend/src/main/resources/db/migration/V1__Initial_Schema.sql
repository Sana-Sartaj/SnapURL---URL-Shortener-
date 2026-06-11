-- =============================================
-- V1__Initial_Schema.sql
-- URL Shortener Database Schema
-- =============================================

-- Enable UUID extension (if needed later)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- URLS TABLE
-- Primary data store for all short URLs
-- =============================================
CREATE TABLE IF NOT EXISTS urls (
    id              BIGINT          PRIMARY KEY,    -- Snowflake ID
    short_code      VARCHAR(20)     NOT NULL UNIQUE,
    original_url    TEXT            NOT NULL,
    title           VARCHAR(255),
    created_by_ip   VARCHAR(45),
    click_count     BIGINT          NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN         NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

-- Indexes for hot query paths
CREATE UNIQUE INDEX idx_urls_short_code     ON urls(short_code);
CREATE        INDEX idx_urls_created_at     ON urls(created_at DESC);
CREATE        INDEX idx_urls_expires_at     ON urls(expires_at) WHERE expires_at IS NOT NULL;
CREATE        INDEX idx_urls_active_clicks  ON urls(click_count DESC) WHERE is_active = true;

-- =============================================
-- CLICK ANALYTICS TABLE
-- Append-only analytics log
-- =============================================
CREATE TABLE IF NOT EXISTS click_analytics (
    id          BIGSERIAL       PRIMARY KEY,
    url_id      BIGINT          NOT NULL,
    short_code  VARCHAR(20)     NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    referer     VARCHAR(500),
    country     VARCHAR(100),
    device_type VARCHAR(50),
    clicked_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_click_url_id     ON click_analytics(url_id);
CREATE INDEX idx_click_short_code ON click_analytics(short_code);
CREATE INDEX idx_click_timestamp  ON click_analytics(clicked_at DESC);

-- Partition by time for large scale (optional, prepared for future)
-- CREATE INDEX idx_click_daily ON click_analytics(DATE(clicked_at), short_code);

-- =============================================
-- FOREIGN KEY (soft reference — analytics can exist after URL deleted)
-- =============================================
-- NOT adding FK constraint deliberately:
-- Analytics should survive URL deactivation for historical reporting

-- =============================================
-- INITIAL DATA / SEED
-- =============================================
-- Demo URL to show system is working
INSERT INTO urls (id, short_code, original_url, title, created_by_ip, click_count, is_active, created_at)
VALUES (
    1704067200000000001,
    'demo01',
    'https://github.com',
    'GitHub - Demo URL',
    '127.0.0.1',
    0,
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS (documentation in schema)
-- =============================================
COMMENT ON TABLE urls IS 'Primary URL mapping table. IDs are Snowflake IDs for distributed generation.';
COMMENT ON COLUMN urls.id IS 'Snowflake ID: 41-bit timestamp + 10-bit machine ID + 12-bit sequence';
COMMENT ON COLUMN urls.short_code IS 'Base62-encoded Snowflake ID or custom alias';
COMMENT ON COLUMN urls.click_count IS 'Denormalized counter. Updated atomically via UPDATE ... SET click_count = click_count + 1';

COMMENT ON TABLE click_analytics IS 'Append-only click log. Written async after redirect to avoid latency impact.';
