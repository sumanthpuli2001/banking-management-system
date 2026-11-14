# Multi-stage Dockerfile for Spring Boot 3 on Java 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8989
EXPOSE 8989
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
