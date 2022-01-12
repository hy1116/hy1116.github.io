---
title : "Java - DTO & VO "
category : "Java"
tages : [Java]
date : 2021-09-24T18:00:00
last_modified_at: 2021-09-24T18:00:00
comment : true
---

## DTO & VO

### DTO(Data Transfer Object)

- 전송되는 데이터의 컨테이너
- Layer간의 통신 용도로 오가는 객체를 말하기도 한다

- 일반적인 DTO는 로직을 가지고 있지 않다. 순수한 데이터 객체이며 속성과 속성에 접근하기 위한 getter, setter메서드로만 구성되는 POJO[^1]



### VO (Value Object)

- 데이터 그 자체로 의미 있는 것을 담고 있는 객체
- DTO와 동일한 개념이나 차이점은 Read–Only 속성 객체 (거의 불변성을 가짐)
- 간단한 독립체( Entity )를 의미하는 작은 객체를 의미



---

[^1]: 특정 인터페이스 또는 클래스를 상속하지 않는 일반 자바 개체



---

**references**

- [swk의 지식저장소](https://swk3169.tistory.com/293)