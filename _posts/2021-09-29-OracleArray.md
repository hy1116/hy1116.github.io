---
title : "Oracle - Array "
category : "Oracle"
tages : [Oracle]
date : 2021-09-29T18:00:00
last_modified_at: 2021-09-29T18:00:00
---

### Associative Array

- TYPE 이름 IS TABLE OF 값타입 INDEX BY 인덱스타입;

```sql
DECLARE
TYPE TYPE_ARR IS TABLE OF NUMBER INDEX BY NUMBER; -- 타입을 정의
USERLEVELARR TYPE_ARR; -- 해당타입으로 배열선언
BEGIN
    USERLEVELARR(1) := 873;
    USERLEVELARR(2) := 874;
    FOR i IN 1..2
    LOOP
    DBMS_OUTPUT.PUT_LINE(USERLEVELARR(i));
    END LOOP;
END;
/*
873
874
*/
```

### VARRY

- TYPE 이름 IS VARRAY(최대 크기) OF 배열 요소의 타입
- 가변길이의 배열이다.
- **시작 인덱스는 1부터 시작**

```sql
DECLARE
TYPE TYPE_ARR IS VARRAY(4) OF NUMBER; -- 타입을 정의
USERLEVELARR TYPE_ARR; -- 해당타입으로 배열선언
BEGIN
    USERLEVELARR := TYPE_ARR(873,874,876,877);
    FOR i IN 1..4
    LOOP
    DBMS_OUTPUT.PUT_LINE(USERLEVELARR(i));
    END LOOP;
END;
/*
873
874
876
877
*/
```

추가로, DBMS 출력창은 sqldeveloper의 상단바의 '보기'탭에서 'DBMS출력'으로 확인 가능

