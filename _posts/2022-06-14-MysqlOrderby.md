---
title : "Database - MysqlOrderby"
category : "Database"
tags : [Database, MySQL]
date : 2022-06-14T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---

### ORDER BY FIELD & ORDER BY FIND_IN_SET

where ~ in (…)에서 in조건 순서대로 정렬하고 싶을때

```java
SELECT * FROM foo where id in (2,3,1) ORDER BY FIELD(id,2,3,1);  
SELECT * FROM foo where id in (2,3,1) ORDER BY FIND_IN_SET(id,"2,3,1");
```