---
title : "Java - Byte단위의 substring & Character Encoding"
category : "Java"
tages : [Java]


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