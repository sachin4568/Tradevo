#!/bin/bash
# Healthcheck script for Docker HEALTHCHECK instruction.
# Exits 0 if healthy, non-zero otherwise.

curl -sf "http://localhost:8000/health" > /dev/null 2>&1