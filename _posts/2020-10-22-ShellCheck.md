---
title : "shell - install/firewall check"
category : "shell"
tags : [shell]
date : 2020-10-22T18:00:00
last_modified_at: 2020-10-22T18:00:00
---

### install check

 기존 서버와 동일하게 세팅을 해야 하기에 기존 서버의 히스토리부터 확인했다. 설치된 yum list & Version을 체크해서 기록해뒀다.

```shell
history | more # 히스토리 먼저 1번부터 쭉 확인하기

yum list installed | more # 설치된 리스트 확인
rpm -qa | grep [name] # version check

crontab -l # deamon? job schedualer? check / ex) rdate
```



### firewall check

```shell
# Port 열기
firewall-cmd --zone=public --permanent --add-port='openportnumber'/tcp 
firewall-cmd --reload

# Port 리스트
firewall-cmd --zone=public --list-all
```