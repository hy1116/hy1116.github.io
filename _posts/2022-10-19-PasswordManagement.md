---
title : "Java - Password Management: Password in Configuration File"
category : "Java"
tags : [Password in Configuration File]
date : 2022-10-19T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---
## Password Management: Password in Configuration File

- DB정보가 담긴 프로퍼티를 plain-text가 아닌 암호화 된 값으로 저장해야 한다는 보안 지적 사항을 전달 받아 아래와 같이 수정함.

- 개발 환경 : `java8`, `spring sts4`, `maven`

### jasypt

[https://www.devglan.com/online-tools/jasypt-online-encryption-decryption](https://www.devglan.com/online-tools/jasypt-online-encryption-decryption)

- `applicationContext.xml` 에 추가

```xml
<!-- properties 암호화 시 오류로 주석처리 -->
	<!-- <context:property-placeholder properties-ref="propertiesFactory" /> -->

<!-- 
		보안성 검토
		Password Management: Password in Configuration File
		properties 암호화 추가
	 -->
	<!-- peoperties 암호화 -->
	<bean id="environmentVariablesConfiguration" class="org.jasypt.encryption.pbe.config.EnvironmentStringPBEConfig">
		<property name="algorithm" value="PBEWithMD5AndDES" />
		<!-- DB password 암호화 키 환경변수 사용 -->
		<!-- <property name="passwordEnvName" value="" /> -->
	</bean>
	
	<bean id="configurationEncryptor" class="org.jasypt.encryption.pbe.StandardPBEStringEncryptor">
		<property name="config" ref="environmentVariablesConfiguration" />
		<property name="password" value="#{systemProperties['']}" />
	</bean>
	<bean id="propertyConfig" class="org.jasypt.spring31.properties.EncryptablePropertyPlaceholderConfigurer">
	    <constructor-arg ref="configurationEncryptor"/>
	    <property name="locations">
	        <list>
	            <value>classpath:dbinfo.properties</value>
	        </list>
	    </property>
	</bean>
```

- 환경변수 설정
    1. 윈도우의 경우 STS에서 윈도우 환경변수를 가져오지 못하므로 run configuration에 추가
    STS Run > Run configuration > Environment > New..
    2. tomcat 실행파일에 -DEVN_NAME=env_value 추가
    3. EnvironmentStringPBEConfig의 passwordEnvName 사용

### dbinfo.properties

- `ENC()` 로 감싸고 안에 `jasypt` 를 통해 암호화 한 값으로 변경

```yaml
Globals.DbType=oracle
Globals.DriverClassName=oracle.jdbc.driver.OracleDriver
Globals.Url=ENC(ZYZCT2RusLaVYYBtXtOBj+bzgVqIUiL/YHuIEjr8IK77AZP67MLPEkxj3dayRQ/pCNU79d0E0lm+4bojAGNLLA==)
Globals.UserName=ENC(JQECtL5j3DdAdjcgoaMttaJWrHiSQR8d)
Globals.Password=ENC(wAAZc3rcqnnNWlOd7ISvKrfkSAInrr34)
```