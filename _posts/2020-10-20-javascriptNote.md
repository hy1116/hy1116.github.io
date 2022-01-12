---
title : "Javascript - 자주 헷갈리는 것 정리"
category : "Javascript"
tags : [Javascript]
date : 2020-10-20T18:00:00
last_modified_at: 2020-10-20T18:00:00
---

​	자바와 자바스크립트를 같이 사용하며 자주 혼동 되는 것 들이 있다. 앞으로는 혼동하지 않고자 정리한다.

---

#### Javascript 거듭제곱 & 제곱근

```javascript
// pow : 특정숫자의 거듭제곱 값을 계산해주는 함수
Math.pow([대상숫자],[거듭제곱 횟수])
// squart : 특정숫자의 제곱근 값을 계산해주는 함수
Math.sqrt([대상 숫자]);
```

```javascript
//answer = [...new Set(array)].sort((a, b) => a - b); 
array.sort((a,b)=>a-b) // 오름차순
array.sort((a,b)=>a-b) // 내림차순
array.sort()// ASCII 문자 순서로 정렬되어 숫자의 크기대로 나오지 않음
```

#### var, let, const

- `var` => **function**-scoped , 변수 재 선언 가능
- `let`, `const` => **block**-scoped, 변수 재 선언 불가
  - `let` => 변수 재 할당 가능
  - `const` => 변수 재 할당 불가

```


```
