---
title : "DataStructure - Queue"
category : "DataStructure"
tags : [Java, Queue,Heap]
date : 2022-07-26T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---

## Queue

### 특징

- 선입선출(FIFO)형 리스트 구조
- 넓이우선탐색(BFS)에서 사용

## Function

```java
// Define
import java.util.Queue;
Queue<Integer> queue = new LinkedList<>();
```

| func | return |
| --- | --- |
| add() | 추가(Exception) |
| offer() | 추가(false) |
| element() | 조회(Exception) |
| peek() | 조회(null) |
| remove | 삭제(Exception) |
| poll | 삭제(null) |

## Priority Queue

- 들어간 순서에 상관없이 우선순위가 높은 데이터가 먼저 나오는 것
- 힙(Heap)이라는 자료구조를 가지고 구현 할 수 있다.

## Heap

- **완전 이진트리**
- `최대힙` : 루트 노드로 올라갈수록 저장된 값이 **커지는** 구조
- `최소힙` : 루트 노드로 올라 갈수록 저장된 값이 **작아지는** 구조
- 최대힙 최소힙 모두 루트노드는 우선순위 높은값이 자리잡음