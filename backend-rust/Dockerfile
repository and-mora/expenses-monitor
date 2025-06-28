# Base image for the build stage - this is a multi-stage build that uses cross-compilation (thanks to --platform switch)
FROM --platform=$BUILDPLATFORM lukemathwalker/cargo-chef:latest-rust-latest AS chef
WORKDIR /app

# Planner stage
FROM --platform=$BUILDPLATFORM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

#------------------ Build arm64

FROM --platform=$BUILDPLATFORM chef AS builder-arm64
COPY --from=planner /app/recipe.json recipe.json

WORKDIR /app

# Install dependencies for cross-compilation and protobuf
RUN dpkg --add-architecture arm64 \
    && apt-get update \
    && apt-get install -y \
    protobuf-compiler \
    g++-aarch64-linux-gnu \
    libc6-dev-arm64-cross \
    libssl-dev:arm64 \
    && rustup target add aarch64-unknown-linux-gnu \
    && rm -rf /var/lib/apt/lists/*

# Build dependencies - this is the caching Docker layer!
RUN CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc cargo chef cook --target=aarch64-unknown-linux-gnu --release --recipe-path recipe.json

# Copy the source code
COPY . /app
ENV SQLX_OFFLINE=true

# Build application - this is the caching Docker layer!
RUN CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc cargo build --target=aarch64-unknown-linux-gnu --release

#----------------- Build amd64

FROM --platform=$BUILDPLATFORM chef AS builder-amd64
COPY --from=planner /app/recipe.json recipe.json
WORKDIR /app

# Copy the source code
COPY . /app

RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
ENV SQLX_OFFLINE=true

RUN cargo build --release

#------------------ Final arch stage

FROM --platform=linux/arm64 ubuntu:noble-20240827.1 AS runtime-arm64
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  # Clean up
  && apt-get autoremove -y \
  && apt-get clean -y

COPY --from=builder-arm64 /app/target/aarch64-unknown-linux-gnu/release/expenses-monitor-be expenses-monitor-be

FROM --platform=linux/amd64 ubuntu:noble-20240827.1 AS runtime-amd64
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  # Clean up
  && apt-get autoremove -y \
  && apt-get clean -y

COPY --from=builder-amd64 /app/target/release/expenses-monitor-be expenses-monitor-be

#---------- Runtime stage

FROM runtime-${TARGETARCH}
WORKDIR /app
COPY configuration.yaml configuration.yaml
ENV APP_ENVIRONMENT=production
EXPOSE 8080
ENTRYPOINT ["./expenses-monitor-be"]
