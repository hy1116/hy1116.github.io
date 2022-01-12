---
title : "shell - ping, telnet, curl"
category : "shell"
tags : [shell]
date : 2021-09-23T18:00:00
last_modified_at: 2021-09-23T18:00:00
---
### ping

- ping(Packet Internet Groper) [^1]
- 지정한 대상에게 패킷을 전송하고 대상이 보내는 응답을 분석
- ICMP[^2]라는 프로토콜을 사용하여 통신
- 3계층에 속하는 네트워크 프로토콜이므로 4계층에서 사용하는 port 정보를 이용하지 않는다

```shell
ping [option][목적지]
# option
# -i 패킷의 바이트 크기 지정
# -n 횟수
```

### telnet

- 컴퓨터와 컴퓨터 사이를 연결해주는 명령어(원격 터미널 접속 기능)

```shell
telnet [목적지] [port]
# 연결 성공 후
POST /index.html HTTP/2.0 
# 위와 같이 입력가능
```

### curl

- 서버와 통신할 수 있는 커맨드 명령어 툴
- HTTP 프로토콜뿐 아니라 다양한 프로토콜을 이용할 수 있다

```shell
curl [목적지] #default:GET
#option
# -X [HTTP method]
# -H ['헤더 타입: 헤더 값']
# -d ['바디 타입: 바디 값'] 
```

----

**references**

- [https://toneyparky.tistory.com/59](https://toneyparky.tistory.com/59)

----

[^1]:  ICMP라는 프로토콜을 사용하여 통신하는데 프로토콜이란 한 지점에서 다른 지점으로 서로 통신할 때에 사용하는 규약
[^2]:  ICMP는 OSI 7 계층의 3 계층에 해당하는 Network 계층에 속하는 프로토콜