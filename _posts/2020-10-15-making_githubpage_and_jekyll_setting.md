---
title : "JeKyll기반의 블로그(Github Page) 만들기 - make gitproject and jekyll setting"
tags : [ Github Page ,Jekyll ]
category : "/GithubPage and Jekyll/"
last_modified_at: 2020-10-15T16:46:00
comment : true
---

## Making Github Page & Jekyll History

@20201015

### 01. make git project

 **github page**는 비용이 들지 않고 간단하게 **웹 호스팅**을 할 수 있도록 해주는 github의 기능중 하나이다.

하지만, **정적**인 웹이므로 구현 가능한 기능이 한정적이다. DB를 사용하지 않기 때문에 게시판, 댓글, 통계 등의 기능을 추가 할 수 없으나 이러한 기능을 사용 할 수 있도록 하는것이 **Jekyll**과 플러그인들을 통해 해당 기능들을 사용 할 수 있도록 만든다.

**Jekyll**은 ruby 기반으로 만들어진 **설치형블로그**이다. 마크다운언어(.md)를 html로 변환하여 정적 사이트를 만들어준다.

기존에 미리 셋팅을 해두었기에 기억나는 내용을 간략히 정리해 봄.

----

- git repository `[username].github.io`를 생성

- `gh-page` 브랜치 생성

- jekyll 사용

- install ruby and setting - *로컬로 테스트를 하기 위하여 설치*

  ```shell
  # ruby command
  bundle (exec)# deploy
  jekyll serve # server start command
  
  # http://localhist:40000
  ```

- theme : `minimal-mistakes` - [Jekyll theme site](http://jekyllthemes.org/)

- git 연동 및 수정 : `vsCode`&`Typora`사용 ( *git bash사용하기 귀찮아서.. 좋은 툴 있다면 알려주세요!!* ) 




---

 **마치며,** 생각 했던 것과는 달리 한 줄 정도의 수정으로 여러 서비스를 연동 할 수 있어 전혀 어려움울 것이 없었다. 귀찮을 것이라 생각한 것이 민망할정도..

아직은 부족한 기능이 많지만 앞으로 하나씩 붙여가며 정리 해두고 싶은 내용을 포스팅 해보려 한다.

본인만의 블로그를 만들어 보고싶은 사람은 한 번쯤 만들어 놓고 여러 기능들을 붙여가며 발전시켜나가는 재미가 있을듯하다. - 2020/10/15

----

###### references

- theme적용 및 포스팅 : [https://imreplay.com/blogging/](https://imreplay.com/blogging/minimal-mistakes-%ED%85%8C%EB%A7%88%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-githubio-%EB%B8%94%EB%A1%9C%EA%B7%B8-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0/)



