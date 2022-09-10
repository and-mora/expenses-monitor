FROM maven:3.8.6-amazoncorretto-17 as buildtime

WORKDIR /build
COPY . .

RUN mvn clean package

FROM amazoncorretto:17 as runtime

WORKDIR /app

COPY --from=buildtime /build/target/*.jar /app/app.jar
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
