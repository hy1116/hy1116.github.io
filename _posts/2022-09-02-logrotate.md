---
title : "OS - Logrotate"
category : "OS"
tags : [Logrotate]
date : 2022-09-02T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---

# Logrotate

- OS 설치 시 기본으로 설치되어있다.(없을시 명령어로 설치)
- `Logrotate.conf` : /etc/logrotate.d
- `Logrotate.d` : /etc/logrotate.conf

## 실행순서

1. crontab
2. cron.daliy
3. Logrotate
4. Logrotate.conf
5. Logrotate.d

## Logrotate.conf

```sql
# rotate log files weekly
# log 회전 주기 yearly : 매년, monthly : 매월, weekly : 매주, daily : 매일
daily

# keep 4 weeks worth of backlogs
# log 파일 개수, 해당 개수가 넘어가면 logrotate의 주기에 따라 실행됨
rotate 7

# create new (empty) log files after rotating old ones
# 새로운 log 파일 생성 여부, create : log 파일 생성, empty : log 파일 생성 안함
create

# use date as a suffix of the rotated file
# 파일명 날짜 여부, logrotate 실행 후 log파일에 날짜를 부여
dateext

# uncomment this if you want your log files compressed
# log파일 압축 여부, 로그 파일 크기 조절 용도
# compress

# RPM packages drop log rotation information into this directory
# 개별 로그 process 설정 경로
include /etc/logrotate.d
```

## Logrotate.d

- 프로세스별 로그 설정

```sql
/var/log/maillog /var/log/freshclam.log {
	// 일 단위로 실행
	daily
    	// 회전 주기 파일 개수
        rotate 7
        // log 파일 내용 없을 시 rotate 하지 않음
        notifempty
        // log 파일 없을 경우 error 메시지 출력 후 다음 실행
        missingok
        // 로그 파일 압축
        compress
        // 여러개 log 파일을 script로 공유하여 실행
        sharedscripts
        // logrotate 실행 후 스크립트 실행(스크립트 파일 경로가 와도 됨)
        postrotate
                /bin/kill -HUP `cat /var/run/syslogd.pid 2>/dev/null` 2> /dev/null || true
        endscript
}
```

### Logrotate 실행

```bash
# 전체 실행
/usr/sbin/logrotate -f /etc/logrotate.conf
# 특정 process 실행
/usr/sbin/logrotate -d /etc/logrotate.d/apache
# logrotate 디버그 모드
/usr/sbin/logrotate -d /etc/logrotate.conf
# 실행 과정 화면 출력
/usr/sbin/logrotate -v /etc/logrotate.conf
```

---

**references**

 - [https://velog.io/@gillog/logrotate](https://velog.io/@gillog/logrotate)