use crate::configuration::TelemetrySettings;
use opentelemetry::{global, KeyValue};
use opentelemetry_otlp::{SpanExporter, WithExportConfig};
use opentelemetry_sdk::metrics::SdkMeterProvider;
use opentelemetry_sdk::trace::{RandomIdGenerator, Sampler, SdkTracerProvider};
use opentelemetry_sdk::Resource;
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
    // OpenTelemetry instrumentation with 0.31 API
    // Build the Resource
    let resource = Resource::builder_empty()
        .with_attributes([KeyValue::new(
            opentelemetry_semantic_conventions::attribute::SERVICE_NAME,
            otlp_settings.service_name.clone(),
        )])
        .build();

    // Build the OTLP exporter
    let exporter = SpanExporter::builder()
        .with_tonic()
        .with_endpoint(otlp_settings.grpc_endpoint.clone())
        .with_timeout(Duration::from_secs(3))
        .build()
        .expect("Failed to create OTLP exporter");

    // Build the tracer provider
    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .with_resource(resource)
        .with_sampler(Sampler::AlwaysOn)
        .with_id_generator(RandomIdGenerator::default())
        .with_max_events_per_span(64)
        .with_max_attributes_per_span(16)
        .build();

    // Set the global tracer provider
    global::set_tracer_provider(provider.clone());

    // Get a tracer from the provider
    let tracer = global::tracer(otlp_settings.service_name.clone());

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

pub fn init_meter(otlp_settings: &TelemetrySettings) -> prometheus::Registry {
    // Setup Prometheus metrics with OpenTelemetry 0.31
    let registry = prometheus::Registry::new();
    let exporter = opentelemetry_prometheus::exporter()
        .with_registry(registry.clone())
        .build()
        .unwrap();

    // Build resource
    let resource = Resource::builder_empty()
        .with_attributes([KeyValue::new(
            opentelemetry_semantic_conventions::attribute::SERVICE_NAME,
            otlp_settings.service_name.clone(),
        )])
        .build();

    let provider = SdkMeterProvider::builder()
        .with_reader(exporter)
        .with_resource(resource)
        .build();

    global::set_meter_provider(provider);

    registry
}
