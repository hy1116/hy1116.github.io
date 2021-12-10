---
titile : "RegEx - 정규표현식 문법 및 예제 정리"
category : "Javascript"
tags : [Java,Javascript]
date : 2020-10-21T18:00:00
last_modified_at: 2020-10-21T18:00:00
comment : true
---
### RegExpression

​	값의 유효성 체크를 할 때 주로 정규표현식을 사용 하게 된다. 문법의 몇 가지만 정리.

#### Grammer

- `^` : 문자열의 시작 (대괄호 맨 앞에쓰면 부정)
- `$` : 문자열의 종료
- `.` : 임의의 한 문자
- `*` : 무한의(DB에서 사용하는 astar와 같음)
- `+` : 문자가 하나 이상
- `?` : 문자가 없거나 하나
- `[]` : 문자의 집합이나 범위를 나타냄 (두 문자 사이는 `-`기호로 범위를 나타냄 - ex. `[1-9]`)
- `{}` : 횟수 또는 범위
- `|` : or 연산

---

#### Java

​	`java.util.regex`패키지를 사용한다. 주로 `Pattern`,`Matcher`클래스를 사용한다.

```java
// Pattern Class

String testStr = "01012341234"; //대상문자열
String pattern = "^[0-9]*$"; // 숫자 확인
boolean regex = Pattern.matches(pattern, testStr); // true

String testStr = "testStr"; //대상문자열
String pattern = "^[a-zA-Z]*$"; // 영문자 확인
boolean regex = Pattern.matches(pattern, testStr); // true
```



#### Javascript

​	Javascript의 경우 test함수를 사용해서 아래와 같이 간단히 사용 가능하다.

```javascript
var str = "testSting";

var regEx1 = "^[0-9]*$"; // 처음부터 끝까지 숫자인지 체크
var bool1 = regEx1.test(str); // boolean값으로 반환
console.log(bool1); // false

var regEx2 = "^[a-zA-Z]*$"; // 처음부터 끝까지 모두 영어인지 체크
var bool2 = regEx2.test(str); // boolean값으로 반환
console.log(bool2); // true
```



---

**references**

- [https://coding-factory.tistory.com/529](https://coding-factory.tistory.com/529)
- [https://zzang9ha.tistory.com/322](https://zzang9ha.tistory.com/322)