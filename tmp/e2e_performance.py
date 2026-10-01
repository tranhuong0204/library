import concurrent.futures
import json
import statistics
import time

import requests

BASE = "http://localhost:8080/api"

login = requests.post(BASE + "/auth/login", json={
    "usernameOrEmail": "e2e_user_20260731",
    "password": "TestPass!2026",
}, timeout=15)
login.raise_for_status()
headers = {"Authorization": f"Bearer {login.json()['token']}"}


def request_once(path):
    started = time.perf_counter()
    response = requests.get(BASE + path, headers=headers, timeout=15)
    return response.status_code, (time.perf_counter() - started) * 1000


measurements = {}
for path in ("/health", "/documents", "/forum/posts", "/groups", "/news"):
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        samples = list(executor.map(lambda _: request_once(path), range(30)))
    latencies = sorted(sample[1] for sample in samples)
    measurements[path] = {
        "requests": len(samples),
        "success": sum(1 for status, _ in samples if status == 200),
        "median_ms": round(statistics.median(latencies), 2),
        "p95_ms": round(latencies[int(len(latencies) * 0.95) - 1], 2),
        "max_ms": round(max(latencies), 2),
    }

print(json.dumps(measurements, indent=2))
