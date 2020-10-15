---
layout : posts
title : "Github Page및 JeKyll로 블로그 만들기"
tags : 
    - github
last_modified_at: 2020-10-15T16:46:00
comment : true
---

# Making Github Page History

## @20201014~

### 01. make git project

- git repository '[username].github.io'를 생성

- 'gh-page' 브랜치 생성

- jekyll 사용

- install ruby and setting (http://localhist:40000)

  ```shell
  #ruby command
  bundle (exec)# deploy
  jekyll serve # server start command
  ```

- theme : "minimal-mistakes"

- git 연동 및 수정 : vsCode사용 



### 02. Posting & update setting

#### 02.1 Posting

- 최상위에 '_post' 폴더 없을경우 추가

- 'YYYY-MM-DD-[title].md'형식으로 파일추가

  ```markdown
  #example
  
  ---
  layout : post
  title: "My First Posting (TEST) "
  tags:
    - Blog
  last_modified_at: 2020-10-15T08:06:00-05:00
  comment : true
  ---
  
  markdown형식의 내용
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



#### 02.2 Comment

`disqus`를 이용하여 댓글기능 추가하기

```yaml
# _config.yml에 추가 (사용하는 테마별로 comment기능을 지원하지 않을 수 있음)
# 댓글기능
comments:
  provider               : "disqus" # false (default), "disqus", "discourse", "facebook", "staticman", "staticman_v2", "utterances", "custom"
  disqus:
    shortname            : "boguss-diary" # https://help.disqus.com/customer/portal/articles/466208-what-s-a-shortname-
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

- disqus - Universal Embed Code 추가하기

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

![image-20201015170206952](\assets\images\posts\image-20201015170206952.png)



#### 02.3 Analytics

- Google Analytics ( minimal-mistakes 사용 )

  ```yaml
  # Analytics
  analytics:
    provider               : "google" # false (default), "google", "google-universal", "google-gtag", "custom"
    google:
      tracking_id          : "user tracking id"
      anonymize_ip         : false # true, false (default)
  ```

![image-20201015170009781](\assets\images\posts\image-20201015170009781.png)



#### 02.4 Font

- 웹폰트 설정

  ```html
  <link rel="stylesheet" href="https://fonts.googleapis.com/earlyaccess/nanumgothic.css"> <!-- 나눔고딕 -->
  ```

  - `_layout/default.html`에 해당 폰트링크 추가
  - `assets/css/screen.css` 파일의  `.post-full-content` 부분을 원하는대로 수정 ('나눔고딕'은 한글에 적용됨).



#### 02.5 Search

- 검색기능 추가 예정

----

###### references

- 댓글,통계기능 추가 : https://khbrst.github.io/dev/apply-dynamic-features-to-github-pages/
- theme적용 및 포스팅 : https://imreplay.com/blogging/minimal-mistakes-%ED%85%8C%EB%A7%88%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%B4-githubio-%EB%B8%94%EB%A1%9C%EA%B7%B8-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0/
- 최근 수정일 : https://dev-yakuza.github.io/ko/jekyll/jekyll-last-modified-at/
  - bundle : https://github.com/gjtorikian/jekyll-last-modified-at
