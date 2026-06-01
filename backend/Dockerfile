FROM --platform=$BUILDPLATFORM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jre-alpine AS extractor
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=extractor /app/dependencies/         ./
COPY --from=extractor /app/spring-boot-loader/   ./
COPY --from=extractor /app/snapshot-dependencies/ ./
COPY --from=extractor /app/application/          ./
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
