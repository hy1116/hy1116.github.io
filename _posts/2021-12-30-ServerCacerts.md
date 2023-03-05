---
title : "OS - Server Cacerts 인증서 등록"
category : "OS"
tags : [OS,SSL]
date : 2021-12-30T12:00:00
last_modified_at: 2021-12-30T12:00:00
---

# 2021-12-30-ServerCacerts.md

api연동 작업 중 아래 Exception이 발생하여 원인과 해결법를 찾아봄

## 원인 : **SSLHandshakeException발생**

- java 1.7 버전 이하의 경우 서버/클라이언트간 사용하려는 SSL/TLS 버전이 맞지 않아서 발생
  
    →  SSL인증을 무시하도록 코드를 작성 하거나 연동하려는 클라이언트의 인증서를 받아서 등록
    

## 해결 : 인증서 확인 및 등록

### 확인

```bash
curl https://domain.com # ssl관련 에러메세지 확인

keytool -list -keystore $JAVA_HOME/jre/lib/security/cacerts # 인증서 리스트 확인
```

### 등록

- 클라이언트와 연동을 위해 인증서 등록 시 아래와같이 java경로에서 keytool명령어를 통해 등록가능

```bash
$JAVA_HOME/jre/lib/security/

keytool -import -trustcacerts -keystore $JAVA_HOME/jre/lib/security/cacerts -alias usertrustca -
file [filename.pem|filename.crt|filename.cer..] -storepass changeit
(JAVA cacert 의 기본 암호는 changeit 이다.)
```

→ 등록 후 브라우저에서 접속 하거나 curl명령어로 테스트