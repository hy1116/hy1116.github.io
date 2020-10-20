---
title : "Jekyll 환경 변수( JEKYLL_ENV )"
tags : [jekyll]
category : "GithubPage and Jekyll"
---

​	disqus comments 위치를 옮기면서 `_layouts/single.html`을 체크 하다가 **jekyll.environment**변수를 확인하게 되었다.

```django
{% raw %}
{% if jekyll.environment == "production" %}
   {% include disqus.html %}
{% endif %}
{% endraw %}
```

위와 같이, `production`운영 환경에서만 disqus댓글을 달 수 있도록 되어있었다. 이를 확인하고  해당 변수를 통해 어떤 작업이 가능한지 짧게 정리 해보려 한다.

---

### 환경 변수 셋팅

기본적으로는 default값으로 `devleopment`로 세팅 되어있다. (Gitbub page에 올린 경우는 github 내부적으로 JEKYLL_ENV 가 `production`으로 세팅되어있다.) 개발은 `development` 운영은 `products`를 사용함.

환경 변수를 바꾸고자 한다면 아래와 같이 터미널에서 실행해 주면 된다.

```shell
JEKYLL_ENV=production jekyll build
```

또한, 반대로 개발 환경에서만 확인 하고 싶은 것 이 있다면, 소스에 아래와 같이 작업해 주면 된다.

```django
{% raw %}
{% if jekyll.environment == "development" %}
	<!-- 개발 환경의 소스 -->
{% endif %}
{% endraw %}
```



이 외에도, config파일을 분리하여 사용하거나 환경 변수를 주는 방법이 여러가지 있다. 아래의 래퍼런스를 참고하면 다양한 방법으로 사용이 가능하다.

*지킬 환경변수에 대하여 더 유용하게 사용 될 만한 것이 있다면 이 게시글에 추가로 포스팅 할 예정.*



**references**

- [https://jekyllrb.com/docs/configuration/environments/](https://jekyllrb.com/docs/configuration/environments/)
- [https://jekyllrb.com/docs/configuration/options/#build-command-options](https://jekyllrb.com/docs/configuration/options/#build-command-options)

- [https://blog.seotory.com/post/2017/08/jekyll-development-mode](https://blog.seotory.com/post/2017/08/jekyll-development-mode)

