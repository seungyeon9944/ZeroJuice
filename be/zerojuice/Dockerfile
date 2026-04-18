# JDK 21 기반의 가벼운 이미지를 사용합니다.
FROM eclipse-temurin:21-jdk-jammy 

# Timezone 설정
ENV TZ=Asia/Seoul

# JAR 파일 경로 설정
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

# 실행 명령어 (Timezone 설정 포함)
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "/app.jar"]