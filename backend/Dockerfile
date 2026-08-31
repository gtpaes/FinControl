# ============================================================
# FinControl Backend — imagem para deploy no Render
# Java NÃO é suportado nativamente pelo Render Native Runtime,
# então usamos Docker com build multi-stage:
#   1) Maven + JDK 21 compilam e empacotam o jar;
#   2) JRE 21 enxuta roda apenas o jar.
# A porta vem de $PORT (Render injeta), nunca fixada.
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Cache de dependências: copia pom primeiro
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --from=build /app/target/fincontrol-backend-*.jar app.jar
# Render atribui a porta dinamicamente via PORT; default 8080 local
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
