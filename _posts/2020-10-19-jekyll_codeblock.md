---
title : "Jekyll - Content Code 원문 그대로 출력하기"
tags : [jekyll,django]
category : "GithubPage and Jekyll"
---

 jekyll을 통해 포스팅을 해본 지 얼 마 되지 않아서 포스팅 할 때, codeblock안의 내용이 변환 되어버려 당황스러운 적이 있었다.

간략한 해결 법을 제시 하고자 한다.

이러한 경우 `{% raw %}{% endraw %}`를 사용하면 된다.

예를 들자면 아래의 내용을 출력하고 싶은 경우,

```django
{% raw %}
{% if jekyll.environment == "production" %}
   {% include disqus.html %}
{% endif %}
{% endraw %}
```

```django
{ % raw % } <!--'{','}'(중괄호)와 '%'사이의 공백은 지우고 사용 -->
{% if jekyll.environment == "production" %}
   {% include disqus.html %}
{% endif %}
{ % endraw % } <!--'{','}'(중괄호)와 '%'사이의 공백은 지우고 사용 -->
```

위와 같이 사용하면 된다. html소스도 동일하게 사용.