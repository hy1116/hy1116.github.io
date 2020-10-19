---
title : "Filter, Interceptor, AOP 개념 및 순서"
tags : [ Spring , Spring Security ]
category : "Spring"
last_modified_at: 2020-10-16T18:00:00
comment : true
---

​	평소 코딩시 **공통 프로세스**는 `Interceptor`나`AOP`로 관리 해왔다. 하지만 요청 프로세스의 순서및 개념을 알지 못하여 이번에 정리하고 숙지하여 앞으로는 막힘이 없고자 한다.

---

## Filter, Interceptor, AOP

### 01. Filter, Interceptor, AOP의 개념 

- **Filter** : 요청과 응답을 거른 뒤 정제 하는 역할. 
  - 서블릿 필터는 `DispatcherSevelt`이전에 실행이 되는데 필터가 동작하도록 지정된 자원의 앞단에서 요청 내용을 변경하거나 체크하는 동작을 수행.
  - ` Spring context외부`에 위치하여 스프링에 무관한 자원에 대하여 동작한다.
  - 자원 처리가 끝난 후 응답 내용에 대해서고 변경 가능하다.
- **Interceptor** :  요청에 대한 작업 전/후로 가로챈다.
  - Filter와 다르게 `DispatcherServelt`이 컨트롤러를 호출하기 전, 후로 끼어들기 때문에 `Spring context영역 내부`에서 controller에 관한 요청과 응답에 대해 처리.
- **AOP(**Aspect Oriented Programming-관점지향프로그래밍**)** : OOP를 보완하기 위해 나온 개념
  - 주로 로깅, 트랜잭션, 에러처리 등 비즈니스단의 메서드를 조금 더 세밀하게 조정하고 싶을 때 사용함.
  - 메소드의 전후 지점에 자유롭게 설정 가능
  - URL, Parameter, Annotation등 다양한 방법으로 대상을 지정 할 수 있음.



### 02. Filter, Interceptor, AOP의 차이 

- **Filter**는 `Web Application`에 등록을 하고, **Interceptor**는 `Spring의 Context`에 등록을 한다.

- Interface의 차이

  ```java
  //filter
  public interface Filter {
    void doFilter(ServletRequest request, ServletResponse response, FilterChain chain);
  }
  ```
  ```java  
  // Interceptor
  public interface HandlerInterceptor {
    boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler);
    void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView mav);
    void afterCompletion(HttpServletRequest request, HttpServeletResponse response, Object handler, Exception ex);
  }
  ```

  

### 03. Filter, Interceptor, AOP의 흐름

<img src="\assets\images\posts\Filter,Interceptor,AOP_0001.png" class="image-shadow-card" alt="Filter,Interceptor,AOP_0001" style="zoom:80%;" />

- Interceptor와 Filter는 Servlet 단위에서 실행된다. AOP는 메소드 앞에 Proxy패턴의 형태로 실행된다.



---

**references**

- [https://goddaehee.tistory.com/154](https://goddaehee.tistory.com/154)

- [https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/](https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/)