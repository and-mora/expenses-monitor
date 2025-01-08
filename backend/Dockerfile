FROM gradle:jdk21-alpine@sha256:70c7191c382fc7f956cacd326ded88bf69a01f707aa2556adb931c090377e601 AS build

WORKDIR /app
COPY . .

ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.7.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

ENTRYPOINT ["./gradlew", "bootRun"]
