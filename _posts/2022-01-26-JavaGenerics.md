---
title : "Java- Generics"
category : "Java"
tags : [Java, Generics]
date : 2022-01-26T12:00:00
last_modified_at: 2022-01-26T12:00:00
comment: true
---

## Java Generics

- 타입을 클래스 내부에서 지정하는 것이 아닌 외부에서 사용자에 의해 지정되는 것을 의미

### Generic 장점

- 잘못된 타입이 들어오는걸 컴파일 단계에서 방지
- 클래스 외부에서 타입을 지정할 수 있음
- 따라서, 코드 재사용성을 높일 수 있다.
- 아래의 표는 통상적인 선언일뿐, 꼭 이렇게 선언 할 필요는 없음
    
    
    | Type | 설명 |
    | --- | --- |
    | < T > | Type |
    | < E > | Element |
    | < K > | Key |
    | < V > | Value |
    | < N > | Number |
- 파라미터로 명시 할 수 있는 것은 참조타입만 가능 
(int,char 과 같은 기본형타입(primitive type)은 사용불가)

## Example

### ClassGeneric.java

```java
public class ClassGeneric<E> {
    private E element;	// 제네릭 타입 변수

    public void set(E element) {	// 제네릭 파라미터 메소드
        this.element = element;
    }

    public E get() {	// 제네릭 타입 반환 메소드
        return element;
    }
}
```

### App.java

```java
public class App {
    public static void main(String[] args) {
        ClassGeneric<String> cgstr = new ClassGeneric<>();
        ClassGeneric<Integer> cgint = new ClassGeneric<>();

        cgstr.set("generic test");
        cgint.set(1000);

        if(cgstr.get() instanceof String){
            System.out.println("cgstr is String");
        }
        if(cgint.get() instanceof Integer){
            System.out.println("cgint is Integer");
        }
    }
}
```

---

**references**
- https://st-lab.tistory.com/153