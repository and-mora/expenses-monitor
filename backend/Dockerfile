FROM gradle:jdk17@sha256:5f4ab273b15961c5f22969136ea884ca0343f1d8b2df5c4c6fe0ca8939b401b1 AS build

WORKDIR /build
COPY . .

RUN ./gradlew bootJar --no-daemon

FROM amazoncorretto:17 AS runtime

#EXPOSE 8080

WORKDIR /app

COPY --from=build /build/build/libs/*.jar /app/spring-boot-application.jar

ENTRYPOINT ["java", "-XX:+UnlockExperimentalVMOptions", "-Djava.security.egd=file:/dev/./urandom","-jar","/app/spring-boot-application.jar"]