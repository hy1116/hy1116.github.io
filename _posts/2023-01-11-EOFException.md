---
title : "Java - EOFExcpetion"
category : "Java"
tags : [socket,EOFExcpetion]
date : 2023-01-11T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---

- `ObjectOutputStream` 또는 `ObjectInputStream` 를 사용하여 직렬화, 역직렬화 하는 과정에서 발생한 Exception
- `readObject()` 메소드가 읽을 데이터가 없는 경우,  null이 아닌 `EOFException` 을 반환