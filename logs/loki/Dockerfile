ARG VERSION=3.4

FROM grafana/loki:${VERSION}

# Copy the Loki configuration file
COPY loki-config.yaml /etc/loki/loki-config.yaml

# Run Loki
CMD ["-config.file=/etc/loki/loki-config.yaml"]
