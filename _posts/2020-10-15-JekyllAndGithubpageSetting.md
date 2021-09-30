---
title : "JeKyll기반의 블로그(Github Page) 만들기(1)"
tags : [ Github Page ,Jekyll ]
category : "GithubPage and Jekyll"
date: 2020-10-15T10:21:00
last_modified_at: 2020-10-15T10:21:00
comment : true
---

### 01. make git project

 **[GitHub Pages](https://pages.github.com/)**는 비용이 들지 않고 간단하게 **웹 호스팅**을 할 수 있도록 해주는 github의 기능중 하나이다.

하지만, **정적**인 웹이므로 구현 가능한 기능이 한정적이다. DB를 사용하지 않기 때문에 게시판, 댓글, 통계 등의 기능을 추가 할 수 없으나 이러한 기능을 사용 할 수 있도록 하는것이 **Jekyll**과 플러그인들을 통해 해당 기능들을 사용 할 수 있도록 만든다.

**[Jekyll](https://jekyllrb.com/)**은 ruby 기반으로 만들어진 **설치형블로그**이다. 마크다운언어(.md)를 html로 변환하여 정적 사이트를 만들어준다.

기존에 미리 셋팅을 해두었기에 기억나는 내용을 간략히 정리해 봄.

----

- git repository `[username].github.io`를 생성

- `gh-page` 브랜치 생성( username.github.io이외의 다른 프로젝트에 해당브랜치를 생성하면 `username.github.io/projectname/`으로 해당 프로젝트를 볼 수 있다.)

- jekyll 사용

- install ruby and setting - *로컬로 테스트를 하기 위하여 설치*

  ```shell
  # ruby command
  bundle (exec)# deploy?
  jekyll serve # server start command
  
  # http://localhist:40000
  ```

- theme : **[Minimal Mistake](https://mmistakes.github.io/minimal-mistakes/)** - [Jekyll theme site](http://jekyllthemes.org/)

- git 연동 및 수정 : `vsCode`&`Typora`사용



----

**references**

- [Jekyll](https://jekyllrb.com/)
- [GitHub Pages](https://pages.github.com/)
- [Minimal Mistake](https://mmistakes.github.io/minimal-mistakes/)
- [Jekyll theme site](http://jekyllthemes.org/)

