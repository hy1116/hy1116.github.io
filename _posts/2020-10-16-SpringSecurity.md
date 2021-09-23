---
title : "Spring security"
tags : [ Spring , Spring Security ]
category : "Spring"
last_modified_at: 2020-10-16T18:00:00
comment : true
---

### 01. 스프링 시큐리티

- Spring 기반의 애플리케이션의 **보안**(인증과 권한, 인가 등)을 담당하는 **스프링 하위 프레임워크**이다. 

- '인증'과 '권한'에 대한 부분을 **[Filter 흐름](/spring/Filter-interceptor,AOP/)**에 따라 처리하고 있다. 

- 보안과 관련해서 체계적으로 많은 옵션을 제공해주기 때문에 개발자 입장에서는 일일이 보안관련 로직을 작성하지 않아도 된다는 장점이 있다.

<img src="/assets/images/posts/image-20201016173641596.png" class="image-shadow-card" alt="image-20201015170206952" style="zoom:80%;" />



### 02. 인증(Authentication) & 인가(Authorization)

- **인증(Authentication)**  : 클라이언트가 자신이 주장하는 사용자와 같은 사용자인지 확인하는 과정

- **인가(Authorization)** : 클라이언트가 하고자 하는 작업이 해당 클라이언트에게 허가된 작업인지 확인

 스프링 시큐리티는 기본적으로 인증 절차를 거친 후 인가 절차를 진행하게 되며  인가 과정에서 해당 리소스에 대한 접근 권한을 확인하게 된다. 인증과 인과를 위해 스프링 시큐리티에서는 Principal을 아이디로 Credential을 비밀번호로 사용하는 `Credential 기반의 인증 방식`을 사용한다.

- Principal(접근 주체) : 보호받는 Resource에 접근하는 대상
- Credential(비밀번호) : 접근하는 대상의 비밀번호



### 03. Spring Security 모듈

- SecurityContextHolder
- SecurityContext
- Authentication 
- UsernamePasswordAuthenticationToken 
- AuthenticationProvider 
- Authentication Manager
- UserDetails 
- UserDetailsService 
- Password Encoding
- GrantedAuthority 



(간략한 이론정리만 하고 직접 프로젝트에 셋팅해보며 포스팅하자)



---

**references**

- [Spring](https://spring.io/projects/spring-security)

- [https://mangkyu.tistory.com/76](https://mangkyu.tistory.com/76)

