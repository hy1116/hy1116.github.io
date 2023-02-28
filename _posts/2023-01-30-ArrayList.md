---
title : "Java - ArrayList"
category : "java"
tags : [java, ArrayList]
date : 2023-01-30T12:00:00
last_modified_at: 2023-02-28T12:00:00
comment: true
---
### Arrays.asList()

**Arrays의 ArrayList** 와 **ArrayList** 는 비슷해 보이지만 다른 클래스이다.

import를 먼저 확인해 보면 아래와 같다.

- Arrays : java.util.Arrays.ArrayList
- ArrayList : java.util.ArrayList

Arrays.asList 메소드는 private 정적 클래스인 ArrayList를 반환 함.

따라서, 추가 삭제 등 요소 크기 변경이 불가하다.(`UnsupportedOperationException` 발생)

asList로 반환 된 리스트의 사이즈를 변경 하기 위해서는 `new ArrayList<>()` 를 통해 wrapping하여 사용하면 해결 가능하다.