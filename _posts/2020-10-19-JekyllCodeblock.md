---
title : "Jekyll - Content Code 원문 그대로 출력하기"
tags : [jekyll,django]
category : "GithubPage and Jekyll"
date: 2020-10-16T18:00:00
last_modified_at: 2020-10-16T18:00:00
---

 jekyll을 통해 포스팅을 해본 지 얼 마 되지 않아서 포스팅 할 때, codeblock안의 내용이 변환 되어버려 당황스러운 적이 있었다. 이를 해결하기 위한 간단한 방법을 정리 하고자 한다.

---

예를 들자면 아래의 내용을 출력하고 싶은 경우, `raw & endraw `를 사용하면 된다.

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

