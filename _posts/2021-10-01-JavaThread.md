---
title : "Java - Program, Process, Thread, Java Thread"
category : "Java"
tages : [Java,Thread]
date : 2021-10-01T12:00:00
last_modified_at: 2021-10-01T12:00:00
comment : true
---
### Program, ProCess, Thread
> **Program > Process > Thread**

#### Program
- 프로그램이란, 파일이 저장 장치에 저장되어 있지만 메모리에는 올라가 있지 않은 정적인 상태를 말한다.
- 운영체제가 프로그램에게 독립적인 메모리 공간을 할당해주지 않음(실행하기 전 상태)
- 실행을 하여 메모리 할당을 받게  되면 동적 상태가 되며 이 상태의 프로그램이 프로세스

#### Process
- 운영체제로부터 자원을 할당받은 작업의 단위

#### Thread
- 어떠한 프로그램 내에서, 특히 프로세스 내에서 실행되는 흐름의 단위

#### Java Thread
- JVM에 의해 스케줄되는 실행단위의 코드 블록
- 일반 쓰레드와 거의 차이가 없다.JVM이 운영체제 역할을 함.
- 자바에는 프로세스가 존재하지 않고 쓰레드만 존재


#### Thead vs Process
- 둘 다 **여러 흐름이 동시에 진행**된다는 공통점을 가짐
- 쓰레드의 경우 **자원 공유**가 가능함


### Java Thread
- 사실 자바 쓰레드 사용을 위해 위와 같이 서문을 열었다.
```java
Class ThreadTest extends Thread(){
  private int num;
  private int name;

  public ThreadTest(int num, String name){
		this.num = num;
    this.name = name;
	}

  public void run(){
    while(num > 0){
      sysout(name + num);
    }
  }
}
```
```java
public Class Test(){
  public static void main(String[] args){
    sysout("----------- Start");
    ThreadTest thrd1 = new ThreadTest(5,"Thread One = ");
    ThreadTest thrd2 = new ThreadTest(10,"Thread Two = ");

    thrd1.start();
    thrd2.start();
    sysout("----------- End");
  }
}
```
----
**references**

- [https://ko.wikipedia.org/wiki/%EC%8A%A4%EB%A0%88%EB%93%9C_(%EC%BB%B4%ED%93%A8%ED%8C%85)](https://ko.wikipedia.org/wiki/%EC%8A%A4%EB%A0%88%EB%93%9C_(%EC%BB%B4%ED%93%A8%ED%8C%85))
- [https://velog.io/@raejoonee/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%99%80-%EC%8A%A4%EB%A0%88%EB%93%9C%EC%9D%98-%EC%B0%A8%EC%9D%B4](https://velog.io/@raejoonee/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%99%80-%EC%8A%A4%EB%A0%88%EB%93%9C%EC%9D%98-%EC%B0%A8%EC%9D%B4)