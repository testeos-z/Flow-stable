#!/bin/sh
set -e

# Write the Flowise API key to a file for Prometheus auth
if [ -n "$FLOWISE_METRICS_API_KEY" ]; then
    echo "$FLOWISE_METRICS_API_KEY" > /etc/prometheus/api_key.txt
    chmod 600 /etc/prometheus/api_key.txt
    echo "✅ Flowise metrics API key written to /etc/prometheus/api_key.txt"
else
    echo "⚠️  FLOWISE_METRICS_API_KEY not set — Flowise scrape will fail"
fi

# Start Prometheus with the provided arguments
exec /bin/prometheus "$@"
