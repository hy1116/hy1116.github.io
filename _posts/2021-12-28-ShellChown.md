---
title : "OS - Linux Chown"
category : "OS"
tags : [OS, Linux, Chown]
date : 2021-12-28T12:00:00
last_modified_at: 2021-12-28T12:00:00
---


# 2021-12-28-ShellChown.md

### Chown (소유자 변경 명령어)

```sql
`chown -r owner[:group] [파일명]`
# 현재소유자가 ROOT일경우 ROOT권한으로 명령어 실행
```

- **Option**
    - **H**
        
        - **R** 옵션이 지정된 경우, 명령행의 기호 링크를 따릅니다. 트리 조회에서 발견된 기호 링크는 따르지 않습니다.
    - **L**
        
        - **R** 옵션이 지정된 경우, 명령행의 기호 링크와 트리 조회에서 발견된 기호 링크를 모두 따릅니다.
    - **P**
        
        - **R** 옵션이 지정된 경우, 기호 링크를 따르지 않습니다.
    - **R**
      
        *파일*이 디렉토리를 지정하는 경우, **chown**은 해당 위치에 연결된 전체 서브트리에서 각 파일의 소유자 및 그룹을 반복적으로 변경합니다.
        
    - **h**
      
        기호 링크가 가리키는 파일 대신에 기호 링크의 소유자 및 그룹을 변경합니다.
        

---

**references**

- [https://www.ibm.com/docs/ko/i/7.3?topic=directories-chown](https://www.ibm.com/docs/ko/i/7.3?topic=directories-chown)