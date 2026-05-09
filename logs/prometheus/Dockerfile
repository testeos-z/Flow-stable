ARG VERSION=v3.2.1

FROM prom/prometheus:${VERSION}

# Copy the Prometheus configuration file
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Run Prometheus with 30-day data retention
CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--storage.tsdb.retention.time=30d"]
