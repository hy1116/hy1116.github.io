---
title : "JeKyll기반의 블로그(Github Page) 만들기(4) - setting update"
tags : [ Github Page ,Jekyll ]
category : "GithubPage and Jekyll"
last_modified_at: 2020-10-16T13:59:00
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

위와같이 `navigation`에 `category`,`tags`를 추가 하고자 한다면, 이미 `minimal-mistakes`테마에 `navigation`틀이 만들어져있으므로 원하는대로 변경해주기만 하면 된다. `_data`>`navigation.yml`파일을 확인해보면 바로 알 수 있다. `/category/` ,`/tags/`폴더를 생성해주면 완료된다.

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
      url: /categories/  # 없을경우 폴더생성
    - title: "Tags"
      url: /tags/ # 없을경우 폴더생성
  ```

- 카테고리 목록 추가

  `/category/`폴더에 원하는 카테고리폴더를 만들어주고 포스트 상단 yaml에 `category:"카테고리명"`을 추가해주면 해당 카테고리에 삽입 된다.

- 태깅하기 

  포스팅 파일 yaml에 `tags : [git,jekyll]`와 같은 형식으로 작성해주면 자동으로 태깅된다.



#### 04.3  sidebar (category and tag List)

​	내가 사용하는 테마 번들에는`_includes`폴더에 `tag_list.html`와`category_list.html`이 이미 존재하여 비교적 쉽게 편집하였다.

`_config.yml`의 default에 value(`category_list : true`,`tag_list : true`)를 따로 추가하고 아래와 같이 include된 사이드바의 html만 찾아 추가시켜줌.(`_includes` / `sidebar.html`) 

---

- `_includes` /`sidebar.html`에 if 조건으로 `tag_list.html`와`category_list.html` include.

<img src="\assets\images\posts\image-20201016162539687.png" alt="image-20201016162539687" class="image-shadow-card" style="zoom:80%;" />



#### 04.3  sidebar (toc)

​	 `post`의 sidebar에 toc 추가하기 tag, cate리스트 추가한것과 마찬가지로 기존 번들의 `toc`로 작업하였다.

`minimal-mistakes`테마의 `_layouts`를 확인해보니 `single.html` ( = layout:single ) 에만 toc설정이 가능하도록 되어있다. ~~나의 posts의 default 는 레이아웃이 posts&archive로 설정되어있으므로 `sidebar.html`에 편집해 주었다. 간단하게 single레이아웃의 `{% if page.toc %}...{% endif %}`부분을 복사하여 sidebar의 맨 밑에 붙여주었다.~~

*`layout :posts`의 레이아웃을  `single` 로 변경하고 `_config.yml`의 default 에 `toc-sticky : true`를 추가함.*



----

**references**

- 사이드바 카테고리,태그 리스트 추가 : [https://jooz.dev/](https://jooz.dev/blog/jekyll-add-categories-tags/)





