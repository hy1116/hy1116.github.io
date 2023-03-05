---
title : "SpringBoot- SpringBoot JPA"
category : "SpringBoot"
tags : [SpringBoot,JPA]
date : 2022-01-23T12:00:00
last_modified_at: 2022-01-23T12:00:00
---

## SpringBoot JPA

### JPA
- java 표준 `ORM(Object Relational Mapping)`
- 자바와 데이터베이스의 `패러다임` 을 일치 시켜주기 위한 기술
- SQL종속적인 개발에서 벗어나게 함

## JPA Adjusting
- 엔티티의 수정, 생성시간 관리

```java
@Getter
@MappedSuperclass // JPA Entity 클래스들이 BaseTimeEntity 를 상속할 경우 필드들을 컬럼으로 인식하도록 함
@EntityListeners(AuditingEntityListener.class) // 이 클래스에 JPAAuditing 기능 포함
public class BaseTimeEntity {
    @CreatedDate // Entity 가 생성되어 저장될 때 시간이 자동 저장 됩니다.
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime modifiedDate;
}
```