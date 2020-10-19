---
title : "Spring security(1) - 이론 정리"
tags : [ Spring , Spring Security ]
category : "Spring"
last_modified_at: 2020-10-16T18:00:00
comment : true
---

​	학교나 학원에서는 알지 못했으나 진행 해야 할 프로젝트의 프레임워크를 확인하던 중 `Spring security`가 사용되고 있음을 알고 이제서야 검색하며 배우는 중이다. ( 주로 유지 보수 진행하거나 프로젝트 기본 세팅은 선임들이 해줘서 프로젝트 세팅 관련된 부분을 유심히 보지 못했다.. )

---

### 01. 스프링 시큐리티

**Spring Security**는 Spring 기반의 애플리케이션의 **보안**(인증과 권한, 인가 등)을 담당하는 스프링 하위 프레임워크이다. 

Spring Security는 '인증'과 '권한'에 대한 부분을 [Filter 흐름]()에 따라 처리하고 있다. 

---

- 인증관련 architecture

<img src="/assets/images/posts/image-20201016173641596.png" class="image-shadow-card" alt="image-20201015170206952" style="zoom:80%;" />



### 02. 인증(Authentication) & 인가(Authorization)

- **인증(Authentication)**  : 클라이언트가 자신이 주장하는 사용자와 같은 사용자인지 확인하는 과정

- **인가(Authorization)** : 클라이언트가 하고자 하는 작업이 해당 클라이언트에게 허가된 작업인지 확인

 스프링 시큐리티는 기본적으로 인증 절차를 거친 후 인가 절차를 진행하게 되며  인가 과정에서 해당 리소스에 대한 접근 권한을 확인하게 된다. 인증과 인과를 위해 스프링 시큐리티에서는 Principal을 아이디로 Credential을 비밀번호로 사용하는 `Credential 기반의 인증 방식`을 사용한다.

- Principal(접근 주체) : 보호받는 Resource에 접근하는 대상
- Credential(비밀번호) : 접근하는 대상의 비밀번호







(간략한 이론정리만 하고 직접 프로젝트에 셋팅해보며 포스팅하자)



---

**references**

- [Spring](https://spring.io/projects/spring-security)

- [https://mangkyu.tistory.com/76](https://mangkyu.tistory.com/76)

