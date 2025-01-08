FROM gradle:jdk21@sha256:c582bc70eb666f62d90525367974dd66122bf069c1d45a70f621b0d08bd2182c AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon -x test

FROM amazoncorretto:21.0.5-alpine3.20@sha256:b58ad6dd59169921e674ab8704fd71e5b4f6444e6a1490d0354a4561737b7151 AS runtime

RUN adduser -D 472
WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/app.jar
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.7.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

RUN chown -R 472:472 /app
USER 472

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom", "-javaagent:/app/opentelemetry-javaagent.jar","-jar","/app/app.jar"]
