---
title : "JeKyll기반의 블로그(Github Page) 만들기 - setting update"
tags : [ Github Page ,Jekyll ]
category : "/GithubPage and Jekyll/"
last_modified_at: 2020-10-15T16:46:00
comment : true
---

### 04. Update settings

#### 04.1 Font

- 웹폰트 설정

  ```html
  <link rel="stylesheet" href="https://fonts.googleapis.com/earlyaccess/nanumgothic.css"> <!-- 나눔고딕 -->
  ```

  - `_layout/default.html`에 해당 폰트링크 추가
  - `assets/css/screen.css` 파일의  `.post-full-content` 부분을 원하는대로 수정 ('나눔고딕'은 한글에 적용됨).



#### 04.2 navigation(category,tags) 변경

<img src="/assets/images/posts/image-20201016112619389.png" class="image-shadow-card" alt="image-20201015170009781" style="zoom:80%;" />

위와같이 `navigation`에 `category`,`tags`를 추가 하고자 한다면, 이미 `minimal-mistakes`테마에 `navigation`틀이 만들어져있으므로 원하는대로 변경해주기만 하면 된다. `_data`>`navigation.yml`파일을 확인해보면 바로 알 수 있다. 주석을 해제 하고 포스팅 파일 yaml에 `tags : [git,jekyll]`와 같은 형식으로 작성해주면 자동으로 태깅된다.

----

- `_data`>`navigation.yml`

  ```yaml
  # main links
  main:
    # - title: "Quick-Start Guide"
    #   url: https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/
    # - title: "About"
    #   url: https://mmistakes.github.io/minimal-mistakes/about/
    # - title: "Sample Posts"
    #   url: /year-archive/
    # - title: "Sample Collections"
    #   url: /collection-archive/
    # - title: "Sitemap"
    #   url: /sitemap/
    - title: "Categories"
      url: /categories/
    - title: "Tags"
      url: /tags/
  ```

- 카테고리 목록추가

