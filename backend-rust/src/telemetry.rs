use crate::configuration::TelemetrySettings;
use actix_web_opentelemetry::PrometheusMetricsHandler;
use opentelemetry::trace::TracerProvider;
use opentelemetry::{global, KeyValue};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::metrics::{Aggregation, Instrument, SdkMeterProvider, Stream};
use opentelemetry_sdk::trace::{RandomIdGenerator, Sampler};
use opentelemetry_sdk::{trace, Resource};
use std::time::Duration;
use tracing::subscriber::set_global_default;
use tracing::Subscriber;
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_log::LogTracer;
use tracing_subscriber::fmt::MakeWriter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::{EnvFilter, Registry};

/// Compose multiple layers into a `tracing`'s subscriber.
///
/// # Implementation Notes
///
/// We are using `impl Subscriber` as return type to avoid having to
/// spell out the actual type of the returned subscriber, which is
/// indeed quite complex.
/// We need to explicitly call out that the returned subscriber is
/// `Send` and `Sync` to make it possible to pass it to `init_subscriber`
/// later on.
pub fn get_subscriber<Sink>(
    name: String,
    env_filter: String,
    sink: Sink,
    otlp_settings: &TelemetrySettings,
) -> impl Subscriber + Send + Sync
where
    Sink: for<'a> MakeWriter<'a> + Send + Sync + 'static,
{
    // opentelemetry instrumentation
    let provider = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(otlp_settings.grpc_endpoint.clone())
                .with_timeout(Duration::from_secs(3)),
        )
        .with_trace_config(
            trace::Config::default()
                .with_sampler(Sampler::AlwaysOn)
                .with_id_generator(RandomIdGenerator::default())
                .with_max_events_per_span(64)
                .with_max_attributes_per_span(16)
                .with_max_events_per_span(16)
                .with_resource(Resource::new(vec![KeyValue::new(
                    opentelemetry_semantic_conventions::attribute::SERVICE_NAME,
                    otlp_settings.service_name.clone(),
                )])),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .unwrap();
    let tracer = provider.tracer(otlp_settings.service_name.clone());

    // Create a tracing layer with the configured tracer
    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(env_filter));
    let formatting_layer = BunyanFormattingLayer::new(name, sink);
    Registry::default()
        .with(env_filter)
        .with(JsonStorageLayer)
        .with(formatting_layer)
        .with(telemetry)
}

/// Register a subscriber as global default to process span data.
///
/// It should only be called once!
pub fn init_subscriber(subscriber: impl Subscriber + Send + Sync) {
    LogTracer::init().expect("Failed to set logger");
    set_global_default(subscriber).expect("Failed to set subscriber");
}

pub fn init_meter(otlp_settings: &TelemetrySettings) -> PrometheusMetricsHandler {
    let registry = prometheus::Registry::new();
    let exporter = opentelemetry_prometheus::exporter()
        .with_registry(registry.clone())
        .build()
        .unwrap();
    let provider = SdkMeterProvider::builder()
        .with_reader(exporter)
        .with_resource(Resource::new(vec![KeyValue::new(
            "service.name",
            otlp_settings.service_name.clone(),
        )]))
        .with_view(
            opentelemetry_sdk::metrics::new_view(
                Instrument::new().name("http.server.duration"),
                Stream::new().aggregation(Aggregation::ExplicitBucketHistogram {
                    boundaries: vec![
                        0.0, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0,
                        7.5, 10.0,
                    ],
                    record_min_max: true,
                }),
            )
            .expect("cannot initialize the view to build the metric provider"),
        )
        .build();
    global::set_meter_provider(provider.clone());

    PrometheusMetricsHandler::new(registry)
}
