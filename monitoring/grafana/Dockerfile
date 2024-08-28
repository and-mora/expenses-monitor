ARG GRAFANA_VERSION=11.1.4@sha256:886b56d5534e54f69a8cfcb4b8928da8fc753178a7a3d20c3f9b04b660169805

FROM grafana/grafana:${GRAFANA_VERSION}

USER root

# add chromium for dashboard reporting
RUN apk add --no-cache chromium

USER grafana
