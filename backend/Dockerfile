FROM gradle:jdk17@sha256:5f4ab273b15961c5f22969136ea884ca0343f1d8b2df5c4c6fe0ca8939b401b1 AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon

FROM amazoncorretto:17.0.8-alpine3.18@sha256:0c61f12abfb091be48474e836e6802ff3a93e8e038e0460af8c7f447ccbd3901 AS runtime

WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/app.jar
RUN chown -R nobody:nobody /app

USER 65534

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom","-jar","/app/app.jar"]