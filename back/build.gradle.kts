import net.ltgt.gradle.errorprone.CheckSeverity
import net.ltgt.gradle.errorprone.errorprone

plugins {
    java
    id("org.springframework.boot") version "3.5.8"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.github.spotbugs") version "6.4.8"
    id("org.asciidoctor.jvm.convert") version "4.0.5"
    id("net.ltgt.errorprone") version "5.1.0"
    id("net.ltgt.nullaway") version "3.0.0"
}

group = "com.haruon"
version = "0.0.1-SNAPSHOT"
description = "groupware"

val mockitoAgent: Configuration = configurations.create("mockitoAgent")
val querydslVersion = "7.1"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

configurations {
    create("asciidoctorExt")
}

dependencies {
    // web
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // spring batch
    implementation("org.springframework.boot:spring-boot-starter-batch")
    testImplementation("org.springframework.batch:spring-batch-test")

    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // validation
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-security")
    testImplementation("org.springframework.security:spring-security-test")

    // json web token (jwt)
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    implementation("io.jsonwebtoken:jjwt-impl:0.12.6")
    implementation("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // mysql
    runtimeOnly("com.mysql:mysql-connector-j")
    testRuntimeOnly("com.mysql:mysql-connector-j")

    // docker
    runtimeOnly("org.springframework.boot:spring-boot-docker-compose")

    // lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")

    // spring rest docs
    add("asciidoctorExt", "org.springframework.restdocs:spring-restdocs-asciidoctor")
    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")

    // NullMarked
    implementation("org.jspecify:jspecify:1.0.0")
    errorprone("com.google.errorprone:error_prone_core:2.48.0")
    errorprone("com.uber.nullaway:nullaway:0.13.1")

    // openFeign queryDSL(7.x)
    implementation("io.github.openfeign.querydsl:querydsl-jpa:${querydslVersion}")
    // Q-class generation
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:${querydslVersion}:jakarta")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")

    // mock


}

nullaway {
    onlyNullMarked.set(true)
}

tasks.withType<Test> {
    useJUnitPlatform()
    jvmArgs("-javaagent:${mockitoAgent.asPath}")
}


tasks.withType<JavaCompile>().configureEach {
    options.errorprone {
        check("NullAway", CheckSeverity.ERROR)
        disable("UnusedVariable")       // 사용하지 않는 변수 미표시 (나중에 꺼서 확인해야함)
    }
}

// snippets(코드 조각)의 Dir(디렉토리)를 전역변수로 선언
val snippetsDir by extra { file("build/generated-snippets") }

tasks {

    test {
        useJUnitPlatform()
        outputs.dir(snippetsDir) // 테스트가 끝난 결과물(문서 파일)을 이 snippet 디렉토리로 넣도록 지정
    }

    asciidoctor {

        dependsOn(test)         // 테스트가 성공한 결과물을 받아서, 아스키독터라는 태스크에서 문서를 만든다.
        inputs.dir(snippetsDir)
        configurations("asciidoctorExt")

        sources {
            include("**/index.adoc")
        }

        baseDirFollowsSourceFile()

    }

    bootJar {
        dependsOn(asciidoctor)
        from("${asciidoctor.get().outputDir}") {
            into("static/docs")
        }
    }


}
