FROM gradle:jdk21@sha256:c582bc70eb666f62d90525367974dd66122bf069c1d45a70f621b0d08bd2182c AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon -x test

FROM amazoncorretto:21.0.3-alpine3.19@sha256:e85c947a4f836433fdb0f2c117b50e0dbb11a2eef3811a249ef00b068f6bce9a AS runtime

RUN adduser -D 472
WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/app.jar
RUN chown -R 472:472 /app

USER 472
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.7.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom", "-javaagent:/app/opentelemetry-javaagent.jar","-jar","/app/app.jar"]
