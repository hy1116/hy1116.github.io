---
title : "Java - clean code"
category : "Java"
tags : [Java, CleanCode]
date : 2023-02-10T12:00:00
last_modified_at: 2023-02-28T12:00:00
comment: true
---
*clean code를 읽고 와닿거나 기억해두면 좋을 내용을 기록함.*

#### 객체지향 설계 주요원칙
- OCP(Open Closed Principle) : 소프트웨어 개체(class,module,method ..)는 확장에 대해 열려 있어야 하고, 수정에 대해서는 닫혀 있어야 한다.
- SRP(Single Responsibility Principal) : 작성된 클래스는 하나의 기능만 가지며 클래스가 제공하는 모든 서비스는 그 하나의 책임을 수행하는 데 집중되어 있어야 한다는 원칙이 단일 책임 원칙.
- [자바 객체 지향의 원리 SOLID - SRP : 단일 책임 원칙](https://ktko.tistory.com/entry/%EC%9E%90%EB%B0%94-%EA%B0%9D%EC%B2%B4-%EC%A7%80%ED%96%A5%EC%9D%98-%EC%9B%90%EB%A6%AC-SOLID-SRP-%EB%8B%A8%EC%9D%BC-%EC%B1%85%EC%9E%84-%EC%9B%90%EC%B9%99) 이 블로그에서 완전 이해하기 쉽게 정리해주심


1. 깨끗한 코드
    - *깨끗한 코드는 작성자가 아닌 사람도 읽기 쉽고 고치기 쉽다 - Dave Thomas*
2. 의미있는이름
3. 함수
    - `SRP(Single Responsibility Principal)` : 함수는 한가지만 해야한다.
4. 주석
    - 주석 없이도 의미와 목적을 정확히 전달되는 코드를 작성하는것이 가장 좋다.
5. 형식 맞추기
    - 신문처럼 작성하라.
6. 객체와 자료구조
    - `Visitor Pattern` : 방문자 패턴, 실제 로직을 가지고 있는 객체(Visitor)가 로직을 적용할 객체(Element)를 방문하면서 실행하는 패턴
        - 주로 상속없이 클래스에 method를 효과적으로 추가하기 위해 사용
        - 하지만, 합성객체의 내부구조가 VISITOR에게 열리게 되므로 캡슐화를 위반하는 문제가 발생
    - `디미터 법칙` : 모듈은 자식이 조작하는 객체의 속사정을 몰라야 한다. (객체는 조회 함수로 내부 구조를 공개하면 안된다는 의미)
7. 오류처리
    - `OCP(Open Closed Principle)` : 소프트웨어 개체(class,module,method ..)는 확장에 대해 열려 있어야 하고, 수정에 대해서는 닫혀 있어야 한다.
    - 외부 라이브러리 API의 예외처리 시 wrapping class를 사용하여 감싸주면 라이브러리와 프로그램사이의 의존성이 줄어들어 좋은 방법이다.
    - `Collections.emptyList()` : 읽기전용 빈 리스트