---
title : "Oracle - PL/SQL"
category : "Oracle"
tages : [Oracle]
---
## PL/SQL

### 01. Loop , For, While

```sql
--Ex) Loop
DECLARE
NUM NUMBER :=1; -- 변수명 타입 := 초기화 값;

BEGIN
    LOOP 
    NUM := NUM+1; -- 처리문
    EXIT WHEN NUM >10; -- EXIT [조건]
    END LOOP;
END;
```
```sql
--Ex) While
DECLARE
NUM NUMBER :=1; -- 변수명 타입 := 초기화 값;

BEGIN
	WHILE(NUM1<10)
    LOOP 
    NUM := NUM+1; -- 처리문
    -- EXIT 사용 가능
    END LOOP;
END;
```

```sql
--Ex) For
BEGIN
    FOR I IN 1..9 -- 범위
    LOOP
    DBMS_OUTPUT.PUT_LINE(I); --출력
    END LOOP;
END;
```



### 02. procedure / Function

```sql
-- EX) Procedure
CREATE OR REPLACE PROCEDURE '프로시저명'
(
	변수명 IN 데이터타입, -- 파라미터 변수
	변수명2 IN 데이터타입2
)
IS
[
    변수이름 데이터타입; -- 프로시저내에서 사용 할 변수
]
BEGIN
	처리문;
END;

-- EX) Function
CREATE OR REPLACE FUNCTION '함수명'
    RETURN 리턴타입
IS
   변수명 데이터 타입;
BEGIN
	처리문;
    RETURN 리턴값;
END;
```

#### 	procedure / Function

| Procedure                               | Function                                   |
| --------------------------------------- | ------------------------------------------ |
| 특정 **작업**을 수행                    | 특정 **계산**을 수행                       |
| 리턴값을 안가지거나 여러개 가질 수 있음 | 리턴값을 가져야하며 하나 이상 가질 수 없음 |
| **DB**(서버)단에서 기술                 | **Client**(화면)단 에서 기술               |
| 수단독으로 문장 구성 **가능**           | 단독으로 문장 구성 **불가**                |
| 수식내에서 사용 **불가**                | 수식내에서만 사용 **가능**                 |



#### 최대값의 idx값구하기

```sql
select max(ORDNO) KEEP(DENSE_RANK FIRST ORDER BY regdate DESC) 
from t_coupon_order 
where to_char(regdate,'YYYYMMDD') = 'YYYYMMDD'
;
```
