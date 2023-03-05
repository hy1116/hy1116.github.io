---
title : "Database - Data Language"
category : "Database"
tages : [Database]
date : 2020-10-22T18:00:00
last_modified_at: 2020-10-22T18:00:00
---
그냥 데이터베이스 카테고리 만들고 싶어서 작성해봄.

## Data Language

### 1. DDL(데이터 정의어)

- 데이터를 생성하거나 수정하거나 삭제하는 등  데이터의 전체 골격을 결정하는 역활의 언어

  ```sql
-- EX) CREATE 테이블생성
  CREATE TABLE example(
      first	Number			NOT NULL,
      Second	varchar2(200),
);
  ```
  ```sql
  -- EX)ALTER
  -- 제약조건추가
  ALTER TABLE example ADD CONSTRAINT example_pk PRIMARY KEY (first);
  ALTER TABLE 테이블명 ADD CONSTRAINT 제약조건명 PRIMARY KEY (컬럼명);
  
  -- 컬럼추가
  ALTER TABLE 테이블명 ADD (컬럼명 데이타타입(사이즈));
  -- 컬럼수정
  ALTER TABLE 테이블명 MODIFY(컬럼명 테이타타입(사이즈));
  -- 컬럼삭제
  ALTER TABLE 테이블명 DROP COLUMN 컬럼명
  -- 컬럼변경
  ALTER TABLE 테이블명 RENAME COLUMN 원래컬럼명 TO 바꿀컬럼명;
  ```
  `Drop`은 테이블 정보까지삭제하고, `Truncate`는 테이블 정보는 그대로 둔 채 row만 모두 삭제.
  
  ```sql
  -- EX)DROP
  DROP TABLE 테이블명;
  -- EX)TRUNCATE
  TRUNCATE TABLE 테이블명;
  ```
  
  

### 2. DML(데이터 조작어)

- Table의 행과 열을 조작하는 언어

  ```sql
  --SELECT
  Select * from dual WHERE 조건;
--INSERT
  INSERT INTO 테이블명(..) VALUES(..);
  --UPDATE
  UPDATE 테이블명 SET 컬럼명 = 변경값 WHERE 조건;
  --DELETE
  DELETE 테이블명 WHERE 조건;
  ```
  
  

### 3. DCL(데이터 제어어)

- DB 권한관리 언어

  ```sql
  --GRANT(권한부여)
  GRANT [부여 할 권한] ON [TABLE NAME] TO [USER] ;
GRANT SELECT, INSERT, DELETE, UPDATE ON [TABLE NAME] TO [USER] ;
  --REVOKE(권한회수)
  REVOKE [부여 한 권한] ON [TABLE NAME] FROM [USER];
  REVOKE SELECT, INSERT, DELETE, UPDATE ON [TABLE NAME] FROM [USER] ;
  --COMMIT 
  COMMIT; -- 현재까지 진행 된 delete,Update 작업들을 실제 DB에 적용.
  --ROLLBACK
  ROLLBACK; -- 현재까지 진행 된 delete,Update 작업들을 이전 상태로 되돌림.
  ```
