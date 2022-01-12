---
title : "Oracle - ORDER BY"
category : "Oracle"
tages : [Oracle]
date : 2021-09-23T18:00:00
last_modified_at: 2021-09-23T18:00:00
---

### ORDER BY NULLS

- 오라클은 정렬 시 null값은 마지막으로 정렬된다.[^1]
- null값을 처음에 정렬되게 하려면 `order by [col] nulls first`를 사용하면 된다.

```sql
select*from T_table
order by col nulls first;
```



### KEEP

- KEEP문법을 모를때에는 서브쿼리 또는 인라인 뷰를 통해 정렬 후 rownum으로 최대값의 row정보를 가져왔는데, KEEP문법을 사용하면 한번에 정리가 가능하다.

- 집계함수나 분석함수로 조회된 ROW 에 대해 동작할 수 있다.
- 예를들면, 가장 최근에 들어온 주문의 주문번호를 아래와 같이 구할 수 있다.


##### MAX
```sql
select max(ORDNO) KEEP(DENSE_RANK LAST ORDER BY regdate) 
from t_table;
```

###### MIN
```sql
select min(ORDNO) KEEP(DENSE_RANK FIRST ORDER BY regdate) 
from t_table;
```



----

[^1]: 오라클은 디폴트가 order by [col] nulls last