FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S sagelms && adduser -S sagelms -G sagelms
COPY --from=build --chown=sagelms:sagelms /app/target/*.jar app.jar

USER sagelms
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -jar app.jar"]
