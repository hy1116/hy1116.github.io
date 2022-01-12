---
title : "Oracle - Connect By level "
category : "Oracle"
tages : [Oracle]
date : 2021-12-10T12:00:00
last_modified_at: 2021-12-10T12:00:00
---

### Connect By level

####  Case

1. 연속된 숫자 조회 시
2. 월별 (ex. 1~4월 데이터가 없더라도 1부터 12까지의 데이터 를 집계할 경우)

```sql
select level
from dual
connect by level <=12
```




----
**references**

- [https://meyouus.tistory.com/175](https://meyouus.tistory.com/175)