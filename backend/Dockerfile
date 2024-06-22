FROM gradle:jdk21-alpine@sha256:df0e3bf4964dc6d9977e51498edcf45927a0494d086ed8344dc00876eeca868b AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon -x test

FROM amazoncorretto:21.0.3-alpine3.19@sha256:e85c947a4f836433fdb0f2c117b50e0dbb11a2eef3811a249ef00b068f6bce9a AS runtime

RUN adduser -D 472
WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/app.jar
RUN chown -R 472:472 /app

USER 472

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom","-jar","/app/app.jar"]
