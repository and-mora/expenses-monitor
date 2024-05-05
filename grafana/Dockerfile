ARG GRAFANA_VERSION=10.4.1@sha256:753bbb971071480d6630d3aa0d55345188c02f39456664f67c1ea443593638d0

FROM grafana/grafana-oss:${GRAFANA_VERSION}

ARG GF_INSTALL_IMAGE_RENDERER_PLUGIN="false"

ARG GF_GID="0"

ENV GF_PATHS_PLUGINS="/var/lib/grafana-plugins"
ENV GF_PLUGIN_RENDERING_CHROME_BIN="/usr/bin/chrome"

USER root

# add chromium and plugin for dashboard reporting
RUN mkdir -p "$GF_PATHS_PLUGINS" && \
    chown -R grafana:${GF_GID} "$GF_PATHS_PLUGINS" && \
    apk add --no-cache udev ttf-opensans chromium && \
    ln -s /usr/bin/chromium-browser "$GF_PLUGIN_RENDERING_CHROME_BIN" && \
    grafana cli \
        --pluginsDir "$GF_PATHS_PLUGINS" \
        --pluginUrl https://github.com/mahendrapaipuri/grafana-dashboard-reporter-app/releases/download/v1.3.0/mahendrapaipuri-dashboardreporter-app-1.3.0.zip \
        plugins install mahendrapaipuri-dashboardreporter-app;

ARG GF_INSTALL_PLUGINS=""

RUN if [ ! -z "${GF_INSTALL_PLUGINS}" ]; then \
      OLDIFS=$IFS; \
      IFS=','; \
      set -e ; \
      for plugin in ${GF_INSTALL_PLUGINS}; do \
        IFS=$OLDIFS; \
        if expr match "$plugin" '.*\;.*'; then \
          pluginUrl=$(echo "$plugin" | cut -d';' -f 1); \
          pluginInstallFolder=$(echo "$plugin" | cut -d';' -f 2); \
          grafana cli --pluginUrl ${pluginUrl} --pluginsDir "${GF_PATHS_PLUGINS}" plugins install "${pluginInstallFolder}"; \
        else \
          grafana cli --pluginsDir "${GF_PATHS_PLUGINS}" plugins install ${plugin}; \
        fi \
      done \
    fi

USER grafana

COPY ./provisioning /etc/grafana/provisioning
COPY ./dashboards /etc/grafana/dashboards
COPY ./grafana.ini /etc/grafana/grafana.ini