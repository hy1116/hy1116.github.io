---
title : "Oracle - Select Insert "
category : "Oracle"
tages : [Oracle]
date : 2021-09-29T18:00:00
last_modified_at: 2021-09-29T18:00:00
comment : true
---

### Select값 Insert하기

```sql
insert into t_table(A,B,C)
select col1,col2,col3 from t_table2 ; -- where절 사용가능
-- mysql도 동일
```