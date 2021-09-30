---
title : "Java - Byte단위의 substring & Character Encoding"
category : "Java"
tages : [Java]
date : 2021-09-29T18:00:00
last_modified_at: 2021-09-29T18:00:00
comment : true
---
### substring

```java
String str = "한글byte단위로 자르기";
//str.substring(시작인덱스, 종료인덱스);
String result = str.substring(0, 10);
```

### Byte단위의 substring
- 한글
```java
String str = "한글byte단위로 자르기";
//new String(str.getBytes(), 시작인덱스, 종료인덱스);
String result = new String(str.getBytes(), 0, 10);
```