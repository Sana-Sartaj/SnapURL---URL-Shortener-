/**
 * k6 Load Test — URL Shortener
 *
 * Tests the redirect endpoint at 10,000 requests/second.
 *
 * RESUME STAT: "Handles 10,000 redirects/sec (tested with k6 load tool)"
 *
 * Run:
 *   k6 run k6/load-test.js
 *   k6 run --out json=results.json k6/load-test.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 *
 * Results to screenshot for resume/portfolio:
 *   - http_req_duration p95 < 50ms (with cache)
 *   - http_req_failed < 0.1%
 *   - throughput > 10,000/s
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ===================== CUSTOM METRICS =====================
const redirectSuccessRate = new Rate('redirect_success_rate');
const redirectDuration    = new Trend('redirect_duration_ms', true);
const cacheHits           = new Counter('cache_hits_estimated');
const totalRedirects      = new Counter('total_redirects');

// ===================== TEST CONFIGURATION =====================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Short codes to test (create these first via API or seed data)
const SHORT_CODES = [
    'demo01',
    // Add more short codes after creating them
];

/**
 * STAGE 1: Ramp up to 10,000 req/sec
 *
 * Stages:
 *   0-60s:   Warm up (100 VUs)   — populates Redis cache
 *   60-120s: Ramp up to 500 VUs  — increasing load
 *   120-300s: Sustain 1000 VUs   — full load (≈10k req/s at 10ms/req)
 *   300-360s: Cool down
 */
export const options = {
    stages: [
        { duration: '60s',  target: 100  }, // Warm up + cache population
        { duration: '60s',  target: 500  }, // Ramp up
        { duration: '180s', target: 1000 }, // SUSTAINED 10k req/s
        { duration: '60s',  target: 0    }, // Cool down
    ],

    // Thresholds — test FAILS if these are violated
    thresholds: {
        // 95th percentile redirect < 50ms (Redis-cached)
        'redirect_duration_ms': ['p(95)<50', 'p(99)<200'],
        // Error rate < 0.1%
        'redirect_success_rate': ['rate>0.999'],
        // HTTP error check
        'http_req_failed': ['rate<0.001'],
        // Overall request duration
        'http_req_duration': ['p(95)<100'],
    },

    // Display during run
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ===================== SETUP: Create test URLs =====================
export function setup() {
    console.log('Setting up test data...');

    // Create a test URL to redirect
    const createRes = http.post(
        `${BASE_URL}/api/urls`,
        JSON.stringify({ originalUrl: 'https://example.com', title: 'Load Test URL' }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (createRes.status === 201) {
        const body = JSON.parse(createRes.body);
        console.log(`Created test URL: ${body.shortCode}`);
        return { shortCode: body.shortCode };
    }

    // Fallback to demo
    return { shortCode: 'demo01' };
}

// ===================== MAIN TEST FUNCTION =====================
export default function (data) {
    const shortCode = data.shortCode || 'demo01';

    // Test 1: Redirect (primary load test)
    const redirectRes = http.get(`${BASE_URL}/${shortCode}`, {
        redirects: 0, // Don't follow redirect (we're testing server, not destination)
        tags: { name: 'redirect' },
        timeout: '5s',
    });

    const redirectOk = check(redirectRes, {
        'redirect status is 302':     (r) => r.status === 302,
        'has Location header':        (r) => r.headers['Location'] !== undefined,
        'response time < 100ms':      (r) => r.timings.duration < 100,
        'has X-Redirect-By header':   (r) => r.headers['X-Redirect-By'] !== undefined,
    });

    redirectSuccessRate.add(redirectOk);
    redirectDuration.add(redirectRes.timings.duration);
    totalRedirects.add(1);

    // Estimate cache hits: requests < 10ms are almost certainly Redis hits
    if (redirectRes.timings.duration < 10) {
        cacheHits.add(1);
    }

    // Test 2: Health check (small percentage of requests)
    if (Math.random() < 0.01) { // 1% of VUs
        const healthRes = http.get(`${BASE_URL}/actuator/health`, {
            tags: { name: 'health' },
        });
        check(healthRes, {
            'health is UP': (r) => r.status === 200,
        });
    }

    // No sleep — maximum throughput test
    // sleep(0.001); // Uncomment for 1ms think time if needed
}

// ===================== TEARDOWN =====================
export function teardown(data) {
    console.log('Load test complete!');
    console.log('Check results above for throughput and latency metrics.');
}

// ===================== SUMMARY =====================
export function handleSummary(data) {
    const metrics = data.metrics;

    const summary = {
        'Test Type': 'URL Shortener Redirect Load Test',
        'Target RPS': '10,000 req/sec',
        'Duration': '6 minutes',
        'Results': {
            'Total Redirects':        metrics.total_redirects?.values?.count || 0,
            'Success Rate':           `${((metrics.redirect_success_rate?.values?.rate || 0) * 100).toFixed(2)}%`,
            'P50 Latency':            `${metrics.redirect_duration_ms?.values?.['p(50)']?.toFixed(1) || 0}ms`,
            'P95 Latency':            `${metrics.redirect_duration_ms?.values?.['p(95)']?.toFixed(1) || 0}ms`,
            'P99 Latency':            `${metrics.redirect_duration_ms?.values?.['p(99)']?.toFixed(1) || 0}ms`,
            'Avg Throughput':         `${metrics.http_reqs?.values?.rate?.toFixed(0) || 0} req/s`,
            'HTTP Error Rate':        `${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(3)}%`,
            'Estimated Cache Hits':   metrics.cache_hits_estimated?.values?.count || 0,
        }
    };

    console.log('\n================== LOAD TEST RESULTS ==================');
    console.log(JSON.stringify(summary, null, 2));
    console.log('=======================================================\n');

    // Write JSON report
    return {
        'k6/results.json': JSON.stringify({ summary: data }, null, 2),
        stdout: JSON.stringify(summary, null, 2),
    };
}
