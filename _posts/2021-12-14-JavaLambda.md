---
title : "Java - Lambda "
category : "Java"
tags : [Java]
date : 2021-12-17T12:00:00
last_modified_at: 2021-12-17T12:00:00
---

## lambda

- java 1.8 이상부터 사용 가능
- 익명의 함수 를 지칭하는 용어

### 장점

- 코드가 간결해진다
- 병렬 프로그래밍에 용이함
- 함수를 생성하는 과정을 생략

### 단점

- 불필요하게 사용시 가독성을 떨어뜨릴 수 있음
- 단순한 for,while문을 람다식으로 사용할경우 효율성이 떨어질수 있음
- 재귀식에는 부적합하다
- 디버깅이 어렵다

### Ex.

```java
/* JPA를 사용하는 프로젝트에서 정렬 변경요청으로 JPA를 수정하지않고 해당 페이지에서만 정렬된 리스트를 뿌리기 위해 람다식 정렬 사용 */
// ex. allocItemInfo객체 리스트에서 객체의 PayPriority를 먼저 비교하고 ExpirEndDateTime 또는 PolicyEnd와 비교하여 정렬
allocItemInfoList.sort(Comparator.comparing(AllocItemInfo::getPayPriority)
        	.thenComparing(r -> (r.getUsageExpirEndDateTime()!=null?r.getUsageExpirEndDateTime():welfarePolicyEntity.getPolicyEnd())));
```

## Stram

- 다양한 데이터를 표준화된 방법으로 다루기 위한 라이브러리
- [https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html)




----
**references**
