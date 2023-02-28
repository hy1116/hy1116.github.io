---
title : "Java - Visitor pattern"
category : "Java"
tags : [Java, visitorpattern]
date : 2023-02-10T12:00:00
last_modified_at: 2023-02-28T12:00:00
comment: true
---
## Visitor pattern

- 방문자 패턴, 실제 로직을 가지고 있는 객체(Visitor)가 로직을 적용할 객체(Element)를 방문하면서 실행하는 패턴
- 주로 상속없이 클래스에 method를 효과적으로 추가하기 위해 사용
- 하지만, 합성객체의 내부구조가 VISITOR에게 열리게 되므로 캡슐화를 위반하는 문제가 발생

---

references

- clean code - robert C. Martin
- [https://thecodinglog.github.io/design/2019/10/29/visitor-pattern.html](https://thecodinglog.github.io/design/2019/10/29/visitor-pattern.html)