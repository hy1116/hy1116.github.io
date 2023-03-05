---
title : "OS - ApacheSetting"
category : "OS"
tags : [OS, Apache]
date : 2023-02-27T12:00:00
last_modified_at: 2023-02-28T12:00:00
comments: true
---
팀장님께서 갑자기 테스트서버 아파치 및 배포환경 셋팅을 내일까지 해놓으라고 하셔서 기존에 회사에서 사용하는 아파치 셋팅을 찾아보고 셋팅해 봄 (기록용)

1. 폴더 생성 및 git 연결

```bash
mkdir b2s
git clone ssh://git@[ip]/home/git/repository/[sourcename].git
git status # check
```

1. git souce 내 배포 스크립트 추가 또는 수정
- 기존 운영하던 플랫폼 셋팅과 동일하게 셋팅 해야해서 기존 스크립트를 조금만 수정해서 사용함
- build파일 수정
- was 배포와 web배포 파일 셋팅

1. 톰캣 설정 수정
- 톰캣도 기존 운영되는 톰캣 복사하여 `server.xml` 의 포트셋팅만 수정

1. virtual host(가상 호스트) 셋팅

```bash
cd /usr/local/apache/conf/ # apache directory
# or /etc/httpd/conf.d/

# httpd.conf setting
vi apache/conf/httpd.conf
# 기존에 셋팅되어있어 건드릴 필요가 없었음
```

- 80 port setting

```bash
vi /extra/httpd-vhosts.conf
# --------------------------
<VirtualHost *:80>
    ServerAdmin webmaster@dummy-host.example.com
    DocumentRoot "/var/www/test.host.com/html"
    ServerName test.host.com
    ErrorLog "/var/log/apache/test.host.com/error_log"
    CustomLog "/var/log/apache/test.host.com/access_log" common

    RequestHeader set X-Forwarded-Proto "http"

    JkUnMount /data/* test_fo
    JkMount /*.do test_fo
</VirtualHost>
```

- 443 port setting

```bash
vi /extra/httpd-ssl.conf
# --------------------------
<VirtualHost *:443>
    ServerAdmin webmaster@dummy-host.example.com
    DocumentRoot "/var/www/test.host.com/html"
    ServerName test.host.com

    SSLEngine on
    SSLProtocol all -SSLv2 -SSLv3
    SSLCipherSuite HIGH:MEDIUM:!SSLv2:!PSK:!SRP:!ADH:!AECDH:!DH:!IDEA:!RC4
    SSLCertificateFile /usr/local/apache/conf/ssl/Wildcard.crtfilename.crt
    SSLCertificateKeyFile /usr/local/apache/conf/ssl/Wildcard.keyfilename.key
    #SSLCertificateChainFile /usr/local/apache/conf/ssl/??.crt
    #SSLCACertificateFile /usr/local/apache/conf/ssl/??.crt

    #Header edit Set-Cookie ^(.*)$ $1;SameSite=None;Secure;

    ErrorLog "/var/log/apache/test.host.com/error_log"
    CustomLog "/var/log/apache/test.host.com/access_log" common
    <Directory "/var/wwwtest.host.com/html">
        Options FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    JkUnMount /data/* test_fo
    JkMount /*.do test_fo
</VirtualHost>
```

- `mod_jk` / `mod_proxy`

```bash
vi workers.properties

worker.list=test_fo

worker.kb_fo.type=ajp13
worker.kb_fo.host=127.0.0.1
worker.kb_fo.port=yourportnumber
worker.kb_fo.connection_pool_timeout=600
worker.kb_fo.socket_connect_timeout=10000
```

+ 배포 시 사용 할 alias 추가

- alias파일에 추가 하지 않고 명령어로 추가 시 하루지나면 사라지기 때문에 추가

```bash
vi ~/.bashrc
# add cutom alias
source ~/.bashrc
# 위 명령어를 사용하면 터미널 재접속 없이 적용된다는데 난 재접속 시 적용됨..
```