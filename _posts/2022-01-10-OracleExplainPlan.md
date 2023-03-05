---
title : "Database - ExplainPlan 오라클 실행계획"
category : "Database"
tags : [Database, Oracle,ExplainPlan]
date : 2021-12-20T12:00:00
last_modified_at: 2021-12-20T12:00:00
---
## Oracle 실행계획 확인

```sql
EXPLAIN PLAN -- EXPLANIN  PLAN 선언부
SET STATEMENT_ID = 'PLAN1' INTO PLAN_TABLE -- SQL에 PLAN1이라는 ID 부여
FOR
SELECT * FROM T_TABLE;

-- PLAN_TABLE에 저장된 실행계획 조회
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY('PLAN_TABLE','PLAN1','ALL'));
```