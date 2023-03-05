---
title : "Java- FunctionalInterface"
category : "Java"
tags : [Java, FunctionalInterface,Lambda]
date : 2022-01-26T12:00:00
last_modified_at: 2022-01-26T12:00:00
comment: true
---

## 함수형 인터페이스 (Functional Interface)

- 1개의 추상 메소드를 갖고 있는 인터페이스
- = Single Abstract Method(SAM)
- 주로, 람다식으로 만든 객체에 접근하기 위해 사용함



### 기본 함수형 인터페이스

- **Runnable**

  인자를 받지 않고 리턴값도 없는 인터페이스

  `run()`을 사용

- **Supplier**

  `Supplier<T>`는 인자를 받지 않고 T 타입의 객체를 리턴

  `get()` 메소드를 사용

- **Consumer**

  `Consumer<T>`는 T 타입의 객체를 인자로 받고 리턴 값은 없음

  `accept()`메소드를 사용

  `andThen()`을 사용하면 두개 이상의 Consumer를 연속적으로 실행

- **Function<T, R>**

  `Function<T, R>`는 T타입의 인자를 받고, R타입의 객체를 리턴

  `apply()`메소드를 사용

  `compose()`는 두개의 Function을 조합하여 새로운 Function 객체를 만들어주는 메소드

- **Predicate**

  `Predicate<T>`는 T타입 인자를 받고 결과로 boolean을 리턴

  `test()`메소드를 사용