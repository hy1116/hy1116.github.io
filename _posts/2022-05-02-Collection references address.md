---
title : "Java - Collection references address"
category : "Java"
tags : [boxing]
date : 2022-05-02T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---

```java
LinkedList<Integer> list = Arrays.stream(priorities).boxed().collect(Collectors.toCollection(LinkedList::new));
LinkedList<Integer> list2 = new LinkedList<Integer>();
for(int i : priorities){
   list2.add(new Integer(i)); 
	//인텔리제이에서 이렇게 선언할경우 Unnecessary boxing 'new Integer(i)'로 뜬다
}
```

- new Integer()를 통해 명시적 박싱을 안해줄 경우 value가 같은 요소는 같은 참조값을 가진다