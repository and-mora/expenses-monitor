FROM gradle:jdk21-alpine@sha256: AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon -x test

FROM amazoncorretto:21.0.3-alpine3.19@sha256: AS runtime

RUN adduser -D 472
WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/app.jar
RUN chown -R 472:472 /app

USER 472

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom","-jar","/app/app.jar"]
