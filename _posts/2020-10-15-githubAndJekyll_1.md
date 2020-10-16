---
title : "JeKyll기반의 블로그(Github Page) 만들기"
tags : [github,Jekyll]
last_modified_at: 2020-10-15T16:46:00
comment : true

---

*아직은 얕은 지식으로나마 현재 이해한 내용을 바탕으로 작성하였습니다.*

----

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

- git 연동 및 수정 : `vsCode`사용 ( *git bash사용하기 귀찮아서..* ) 



### 02. Posting

#### 02.1 Posting

 `minimal-mistakes` 테마 적용 기준으로 작성합니다. 해당 테마를 받으면`_config.yml`가 친절히 작성되어있으므로 주석을 참고하여 본인의 정보로 수정하여 주면 된다. 포스팅을 하기 위해서는  최상위에  `_post`폴더가 있어야한다. 없으면 생성해주고 해당 폴더에 `YYYY-MM-DD-[타이틀명].md`형식의 파일을 추가한다 . 해당 파일의 상단에 yaml front matter(layout 및 해당 포스팅에 대한 세팅)을 작성한후 마크다운형식의 본문을 작성하면 포스팅이 완료된다. `_config.yml`을 통하여 포스팅 디폴트값을 설정 할 수 있다.

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



### 03. Add Service

#### 03.1 Comment

 첫 github Page를 접하였을때 셋팅만해두고 사용하지 않았던 가장 큰 이유이다. 당시에 제대로 알아보지 않았기에 DB를 붙일 방법도 없고 정적으로만 사용가능한 점을 알고 흥미를 보이다가 접게 되었다. 하지만, 이번에 다시 접하면서 지킬기반으로 만들어 여러 플러그인 및 연동을 할 수 있는점을 알게되어 시도해보고싶었다.

[disqus](https://disqus.com/) 서비스를 연동 및 세팅(`_config.yml`)을 하면 각 포스팅에 댓글을 달수 있게 된다. 간단한 정보를 입력 하여 본인의 사이트를 추가하면 본인의**Universal Embed Code**를 확인 할 수 있다 해당 코드를 본인이 댓글을 보이고 싶은 위치에 넣어주면된다. (저의 경우는 layout을 post로 사용했기 때문에 `_layouts`폴더의 `posts.html`에 추가하였습니다.)

---

`disqus`를 이용하여 댓글기능 추가하기

```yaml
# _config.yml에 추가 (사용하는 테마별로 comment기능을 지원하지 않을 수 있음)
# 댓글기능
comments:
  provider               : "disqus" # false (default), "disqus", "discourse", "facebook", "staticman", "staticman_v2", "utterances", "custom"
  disqus:
    shortname            : "[username]" # https://help.disqus.com/customer/portal/articles/466208-what-s-a-shortname-
  discourse:
    server               : # https://meta.discourse.org/t/embedding-discourse-comments-via-javascript/31963 , e.g.: meta.discourse.org
  facebook:
    # https://developers.facebook.com/docs/plugins/comments
    appid                :
    num_posts            : # 5 (default)
    colorscheme          : # "light" (default), "dark"
  utterances:
    theme                : # "github-light" (default), "github-dark"
    issue_term           : # "pathname" (default)
  staticman:
    branch               : # "master"
    endpoint             : # "https://{your Staticman v3 API}/v3/entry/github/"
```

- disqus - Universal Embed Code 추가하기(`_layouts`/ `posts.html`)

  ```html
  {% if page.comments %}
  <div id="disqus_thread"></div>
  <script>
  /**
  *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
  *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*/
  /*
  var disqus_config = function () {
  this.page.url = PAGE_URL;  // Replace PAGE_URL with your page's canonical URL variable
  this.page.identifier = PAGE_IDENTIFIER; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
  };
  */
  (function() { // DON'T EDIT BELOW THIS LINE
  var d = document, s = d.createElement('script');
  s.src = 'https://username.disqus.com/embed.js';
  s.setAttribute('data-timestamp', +new Date());
  (d.head || d.body).appendChild(s);
  })();
  </script>
  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
  {% endif %}           
  ```

<img src="image-20201015170206952.png" alt="image-20201015170206952" style="zoom:80%;" />

 

#### 03.2 Analytics

 댓글과 마찬가지로 github page 만으로는 사용 할 수 없던 것이 통계이다. Google Analytics를 사용하면 자신의 블로그를 통계 및 분석이 가능해진다.

[Google Analytics](https://analytics.google.com/)에 본인의 계정으로 접속하여 본인의 웹을 추가 한 후, 본인 웹의 추적ID( tracking id )를 본인의 `_config.yml`파일에 넣어준다

**tracking id**는 본인의 Analytics 홈에서 좌측 하단의 `관리` > `속성 설정` 에 들어가면 확인가능하다. (2020/10/16기준)

---

- Google Analytics `_config.yml` ( minimal-mistakes 사용 _ 각 테마마다 다르므로 본인 테마의 `config파일` 확인)

  ```yaml
  # Analytics
  analytics:
    provider               : "google" # false (default), "google", "google-universal", "google-gtag", "custom"
    google:
      tracking_id          : "user tracking id"
      anonymize_ip         : false # true, false (default)
  ```

<img src="image-20201015170009781.png" alt="image-20201015170009781" style="zoom:80%;" />



### 04. Update settings

#### 04.1 Font

- 웹폰트 설정

  ```html
  <link rel="stylesheet" href="https://fonts.googleapis.com/earlyaccess/nanumgothic.css"> <!-- 나눔고딕 -->
  ```

  - `_layout/default.html`에 해당 폰트링크 추가
  - `assets/css/screen.css` 파일의  `.post-full-content` 부분을 원하는대로 수정 ('나눔고딕'은 한글에 적용됨).



#### 04.2 navigation 변경

![image-20201016112619389](image-20201016112619389.png)



---

 **마치며,** 생각 했던 것과는 달리 한 줄 정도의 수정으로 여러 서비스를 연동 할 수 있어 전혀 어려움울 것이 없었다. 귀찮을 것이라 생각한 것이 민망할정도..

아직은 부족한 기능이 많지만 앞으로 하나씩 붙여가며 정리 해두고 싶은 내용을 포스팅 해보려 한다.

본인만의 블로그를 만들어 보고싶은 사람은 한 번쯤 만들어 놓고 여러 기능들을 붙여가며 발전시켜나가는 재미가 있을듯하다. - 2020/10/15

----

###### references

- 댓글,통계기능 추가 : https://khbrst.github.io/dev/apply-dynamic-features-to-github-pages/
- theme적용 및 포스팅 : https://imreplay.com/blogging/minimal-mistakes-%ED%85%8C%EB%A7%88%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-githubio-%EB%B8%94%EB%A1%9C%EA%B7%B8-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0/
- 최근 수정일 : https://dev-yakuza.github.io/ko/jekyll/jekyll-last-modified-at/
  - bundle : https://github.com/gjtorikian/jekyll-last-modified-at

- 검색기능추가 : [https://moon9342.github.io/jekyll-search](https://moon9342.github.io/jekyll-search)

- [https://blog.hax0r.info/2018-02-18/using-search-from-jekyll/](https://blog.hax0r.info/2018-02-18/using-search-from-jekyll/)



