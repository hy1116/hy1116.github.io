---
title : "SpringBoot - Gradle & SpringBoot"
category : "SpringBoot"
tags : [SpringBoot,Gradle]
date : 2022-01-25T12:00:00
last_modified_at: 2022-01-25T12:00:00
comment: true
---

## Gradle & SpringBoot

### Gradle

- 그래들은 그루비(Grovy)를 기반으로 한 빌드 도구
- maven과 같은 이전세대 빌드도구 단점을 보완한 오픈소스 빌드도구
- pom.xml에 xml로 작성하여 의존선 선언을하는 `maven`과 달리 자바문법과 유사하여 자바개발자가 쉽게 익힐수있음
- `gradle wrapper`를 통해 그래이들이 설치되지않은 시스템에서도 프로젝트 빌드가능

```groovy
buildscript {
    ext {
        springBootVersion = '2.1.7.RELEASE'
    }
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:${springBootVersion}")
    }
}

apply plugin: 'java'
apply plugin: 'eclipse'
apply plugin: 'org.springframework.boot'
apply plugin: 'io.spring.dependency-management'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    // lombok
    annotationProcessor 'org.projectlombok:lombok'
    implementation 'org.projectlombok:lombok'
    // Spring data Jpa : 스프링부트용 spring data jpa 추상화 라이브러리 (스프링부트 버전에 맞게 자동으로 버전을 관리함)
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    // 인메모리 관계형 데이터베이스 (메모리에서 실행 -> 어플리케이션 재시작마다 초기화)
    implementation 'com.h2database:h2'

}

group 'com.hystudy.springboot'
version '1.0-SNAPSHOT'

test {
    useJUnitPlatform()
}
```



## SpringBoot Start

- `bulid.gradle` 의 `groupID` 폴더에 `[Application.java](<http://Application.java>)` 파일 생성하여 아래와 같이 작성
- `SpringBootApplication` : 스프링 부트, Spring Bean 읽기와 생성 자동으로 설정 (위치부터 설정까지 읽어가기때문에 항상 프로젝트 최상단에 작성)
- `SpringApplication.run(Application.class,args)`  : 내장 WAS실행 -> 항상 같은 환경에서 스프링 부트 배포를 가능하게 함

```java
package com.hystudy.springboot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // 스프링 부트, Spring Bean 읽기와 생성 자동으로 설정 (위치부터 설정까지 읽어가기때문에 항상 프로젝트 최상단에 작성)
public class Application {
    public void main(String[] args){
        SpringApplication.run(Application.class,args); // 내장 WAS실행 -> 항상 같은 환경에서 스프링 부트 배포를 가능하게 함
    }
}
```



## Annotation

### SpringBoot Controller

- `@RestController` : 컨트롤러를 json을 반환하는 컨트롤러로 만듬 (ResponseBody와 같은 역할)
- `@GetMapping("/")` : HTTP Method Get 요청을 받음 (RequestMapping(method=RequestMethod.GET)과 같음)
- `@RequestParam("[paramname]")` : paramname으로 정의된 파라미터를 가져옴

### lombok

> STS 사용시 lombok compile 에러날 시 : jar파일 직접 실행 -> STS실행파일 선택asdasd

- `@Getter` : 선언된 모든 필드의 get 메소드를 생성해줌
- `@RequiredArgsConstructor` : 성성된 모든 final 필드의 생성자를 생성해줌



