# SnapURL---URL-Shortener-
SnapURL is a scalable Bit.ly-inspired URL shortener built with Spring Boot, PostgreSQL, Redis, Docker, and AWS. It implements Snowflake-based distributed ID generation for collision-free short URLs, Redis caching to reduce read latency from 80ms to 3ms, and rate limiting. Load tested with k6, the system handles up to 10,000 redirects per second. 
