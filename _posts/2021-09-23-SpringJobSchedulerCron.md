---
title : "Spring Job Scheduler - Cron Expression "
category : "Spring"
tags : [Spring,JobScheduler]
date : 2021-09-23T18:00:00
last_modified_at: 2021-09-23T18:00:00
---
spring scheduler에 배치 셋팅하면서 cron표현식이 자꾸 헷갈려서 정리함.

## Cron Expression
- 크론작업은 반복되는 주기로 예약되며 unix-cron(`    *   *   *   *   *   `)형식으로 지정된다.(ex.매분 매시간 매일 매주 매달)

### Option

`?` : 조건없음 [일, 요일 에서만 사용가능]

`*` : 모든 조건에서 참

- 시작시간/단위 (예 0/5) : 해당 시작시간부터 해당 단위때 참
- 시작범위-끝범위 (예 3-5) : 예제(3-5)는 3에서 5까지 (3, 4, 5) 조건일때 참.
- x,y,z... (예 1,3,5) : 예제(1,3,5) 1,3,5 일때만 참.

`L` : [일, 요일 에서만 사용가능]

- 일에서 사용하면 : 예(L) 마지막 날짜입니다. 예를들어 1월이라면 31일 2월이라면 윤년에 따라 28혹은 29일 4월이라면 30일에 참.
- 요일에서 사용하면 : 예(6L) 6은(토요일) 마지막 토요일에 실행됩니다. 마지막주가 토요일이 없다면 그전주 토요일에 참.

`W` : [일에서만 사용가능]

- 가장 가까운 평일(월~토)를 찾습니다.
- 15W 라고 설정했다면 15일이 월~금 범위라면 해당 날짜에서 참.
- 15W 15일이 토요일이라면 가장 가까운 금요일인 14일에 참.
- 15W 15일이 일요일이라면 가장 가까운 월요일인 16일에 참.

`#` : [요일에서만 사용가능]

- 예를들어 3#2 라고 썻다면 (수요일#2번째주)라는 의미가 됩니다.
- 즉 2번째주의 수요일에 참이 됩니다.



### Example

- `0 0/5 * * *` : 5분마다
- `10 0/5 * * * ?` : 10초 뒤 5분마다 수행.
- `0 30 10-13 ? * WED,FRI` : 매 주 수요일과 금요일 10시~13시 30분에 수행.
- `0 15 10 ? * 6#3` : 매달 3번째 금요일 10시 15분에 실행
- `0 0/30 8-9 5,20 * ?` : 매 월 5일과 20일에 8시~9시대에 30분 간격으로 수행. (8:00, 8:30, 9:00, 9:30) 수행

---

**references**

- [https://gs.saro.me/dev?tn=548](https://gs.saro.me/dev?tn=548)
- [https://www.leafcats.com/94](https://www.leafcats.com/94)
- [https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=estern&logNo=110010101624](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=estern&logNo=110010101624)