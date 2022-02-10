---
title : "Java - Boxing"
category : "Java"
tags : [boxing,wrapper]
date : 2022-02-10T12:00:00
last_modified_at: 2022-02-10T12:00:00
comment: true
---



## Java Wrapper Class

- 자바의 타입은 `기본형 자료형(primitive type) 포장클래스(wrapper class)` 가 있어서 기본형 객체로 다루어야 할 경우에 사용

  | 기본형  | 포장 클래스  |
  | ------- | ----------- |
  | boolean | Boolean     |
  | char    | Character   |
  | byte    | Byte        |
  | short   | Short       |
  | int     | Integer     |
  | long    | Long        |
  | float   | Float       |
  | double  | Double      |

## Boxing

- `박싱(boxing)` : 기본형 → 참조형

- `언박싱(unboxing)` : 참조형 → 기본형

- 오토박싱과 오토 언박싱은 대응되는 자료형 사이에만 일어난다.

- 기본형과 포장형 간의 연산도 가능 (동치여부 검사시에는 `equals()` 메소드 사용)

  ```java
  Integer i = new Integer(1);
  int a1 = (int)i; // 명시적 unboxing (참조형 -> 기본형)
  int a2 = i; // auto unboxing
  Integer b1 = (Integer) // 명시적  boxing (기본형 -> 참조형)
  Integer b2 = a1; // auto boxing
  
  int ic = a1 + b1; // 기본형 포장형 간의 연산
  ```