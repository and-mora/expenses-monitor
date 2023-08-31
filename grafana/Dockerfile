FROM grafana/grafana-oss:10.1.0@sha256:047c1c5aa6fef257b6c2516f95c8fcd9f28707c201c6413dd78328b6cbedff6f

COPY ./provisioning /etc/grafana/provisioning
COPY ./dashboards /var/lib/grafana/dashboards
COPY ./grafana.ini /etc/grafana/grafana.ini

ENTRYPOINT ["/run.sh"]