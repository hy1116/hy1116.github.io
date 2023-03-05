---
title : "JeKyll기반의 블로그(Github Page) 만들기(2) - Posting"
tags : [ Jekyll ]
category : "Jekyll"
date : 2020-10-15T16:46:00
last_modified_at: 2020-10-15T16:46:00
---

### 02. Posting

#### 02.1 Posting

 `minimal-mistakes` 테마 적용 기준으로 작성함
 해당 테마를 받으면`_config.yml`가 친절히 작성되어있으므로 주석을 참고하여 본인의 정보로 수정하여 주면 된다. 우선, 포스팅을 하기 위해서는  최상위에  `_post`폴더가 있어야한다. 없으면 생성해주고 해당 폴더에 `YYYY-MM-DD-[타이틀명].md`형식의 파일을 추가한다 . 
 해당 파일의 상단에 yaml front matter(layout 및 해당 포스팅에 대한 세팅)을 작성한후 마크다운형식의 본문을 작성하면 포스팅이 완료된다. 
 추가로, `_config.yml`을 통하여 포스팅 디폴트값을 설정 할 수 있다.

----

- 최상위에 `_post` 폴더 없을경우 추가

- `YYYY-MM-DD-[title].md`형식으로 파일추가 & yaml front matter 작성

  ```markdown
  layout : post
  title: "My First Posting (TEST) "
  tags:
    - Blog
  last_modified_at: 2020-10-15T08:06:00-05:00
  comment : true
  ```

- 포스팅 default값 설정

  ```yml
  # Defaults
  defaults:
    # _pages
    - scope:
        path: ""
        type: "pages"
      values:
        layout: "default"
        author_profile: true
        read_time: true
        comments: true
        share: true
        related: true
        category_list: true # 원하는 value 추가세팅하여 사용
        tag_list: true
    # scope 추가 사용
    # _posts 
    - scope:
        path: ""
        type: posts
      values:
        layout: single
        author_profile: true
        read_time: true
        comments: true
        share: true
        related: true
        
  ### Scope별로 default값 추가가능
  ```



----

**references**

- GitHub Pages 블로그에 댓글, 통계 분석 기능 추가하기 : [https://khbrst.github.io/dev/apply-dynamic-features-to-github-pages/](https://khbrst.github.io/dev/apply-dynamic-features-to-github-pages/)

- minimal-mistakes-테마를-이용해-githubio-블로그-구축하기 : [imreplay.com](https://imreplay.com/blogging/minimal-mistakes-%ED%85%8C%EB%A7%88%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-githubio-%EB%B8%94%EB%A1%9C%EA%B7%B8-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0/)

