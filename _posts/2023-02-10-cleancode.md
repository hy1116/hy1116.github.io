---
title : "Java - clean code"
category : "Java"
tags : [Java, cleancode]
date : 2023-02-10T12:00:00
last_modified_at: 2023-02-28T12:00:00
comment: true
---
*clean code를 읽고 와닿거나 기억해두면 좋을 내용을 기록함.*

1. 깨끗한 코드
    - *깨끗한 코드는 작성자가 아닌 사람도 읽기 쉽고 고치기 쉽다 - Dave Thomas*
2. 의미있는이름
3. 함수
    - 함수는 한가지만 해야한다.
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
    - `OCP(open closed principle)` : 소프트웨어 개체(class,module,method ..)는 확장에 대해 열려 있어야 하고, 수정에 대해서는 닫혀 있어야 한다.
    - 외부 라이브러리 API의 예외처리 시 wrapping class를 사용하여 감싸주면 라이브러리와 프로그램사이의 의존성이 줄어들어 좋은 방법이다.
    - `Collections.emptyList()` : 읽기전용 빈 리스트