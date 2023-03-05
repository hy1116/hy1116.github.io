---
title : "django 원문 출력"
tags : [Jekyll,Django]
category : "Jekyll"
date: 2020-10-16T18:00:00
last_modified_at: 2020-10-16T18:00:00
---
## django 원문 출력
- 지킬 블로그 셋팅 중 오류가 나서 찾아보니 django문법이랑 충돌로 인해 오류가나서 원문 그대로 출력하는법을 찾아봄.
- 예를 들자면 아래의 내용을 출력하고 싶은 경우, `raw & endraw `를 사용하면 된다.

```django
{% raw %}
{% if jekyll.environment == "production" %}
   {% include disqus.html %}
{% endif %}
{% endraw %}
```

```django
{ % raw % } <!--'{','}'(중괄호)와 '%'사이의 공백은 지우고 사용 -->
{% raw %}
{% if jekyll.environment == "production" %}
   {% include disqus.html %}
{% endif %}
{% endraw %}
{ % endraw % } <!--'{','}'(중괄호)와 '%'사이의 공백은 지우고 사용 -->
```

위와 같이 사용하면 된다. html소스도 동일하게 사용.

