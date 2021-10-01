---
title : "GitPage - Post 날짜 표기 "
category : "GitPage"
tages : [GitPage,Jekyll]
date : 2021-09-30T12:00:00
last_modified_at: 2021-09-30T12:00:00
comment : true
---

### Post 날짜 표기
#### before
- 아래와 같이 포스트들에 `less than 1 minute read`로 표기되는 부분을 날짜로 변경하려 한다.
<img src="/assets/images/posts/addDateImage1.png" alt="image-20201024170236744" class="image-shadow-card" />

#### post yaml
- 일단 포스트들의 `YAML Front Matter`에 입력된 변수에 date가 있어야 한다.
```yaml
title : "GitPage - Post 날짜 표기 "
category : "GitPage"
tages : [GitPage,Jekyll]
date : 2021-09-30T12:00:00
last_modified_at: 2021-09-30T12:00:00
comment : true
```

#### layout $ pege_meta
- 나는 포스트의 레이아웃이 `single`로 되어있어 html을 확인해보니 `less than 1 minute read`가 찍히는 부분이 헤더에 include되어있는 `page__meta.html`에서 찍히는 것을 확인해 봄. (위치나 소스는 각자 다를 수 있음)
- 조건문을 확인 해보면 날짜는 `show_date`와 `date`가 주어졌을 경우 표시 된다. 
```html
{% row %}
<!-- page__meta.html -->
{% if document.read_time or document.show_date %}
  <p class="page__meta">
    {% if document.show_date and document.date %}
      {% assign date = document.date %}
      <span class="page__meta-date">
        <i class="far {% if include.type == 'grid' and document.read_time and document.show_date %}fa-fw {% endif %}fa-calendar-alt" aria-hidden="true"></i>
        <time datetime="{{ date | date_to_xmlschema }}">{{ date | date: "%B %-d, %Y" }}</time>
      </span>
    {% endif %}

    {% if document.read_time and document.show_date %}<span class="page__meta-sep"></span>{% endif %}

    {% if document.read_time %}
      {% assign words_per_minute = document.words_per_minute | default: site.words_per_minute | default: 200 %}
      {% assign words = document.content | strip_html | number_of_words %}

      <span class="page__meta-readtime">
        <i class="far {% if include.type == 'grid' and document.read_time and document.show_date %}fa-fw {% endif %}fa-clock" aria-hidden="true"></i>
        {% if words < words_per_minute %}
          {{ site.data.ui-text[site.locale].less_than | default: "less than" }} 1 {{ site.data.ui-text[site.locale].minute_read | default: "minute read" }}
        {% elsif words == words_per_minute %}
          1 {{ site.data.ui-text[site.locale].minute_read | default: "minute read" }}
        {% else %}
          {{ words | divided_by: words_per_minute }} {{ site.data.ui-text[site.locale].minute_read | default: "minute read" }}
        {% endif %}
      </span>
    {% endif %}
  </p>
{% endif %}
{% endrow %}
```

#### _config.yml 
- `show_date`에 `true`값을 넣고 `read_time`을 `false`로 디폴트 값을 변경하기 위해 `_config.yml`에 아래와 같이 추가 및 수정을 해주었다.
```yml
defaults:
  # _posts
  - scope:
      path: ""
      type: posts
    values:
      layout: posts
      author_profile: false
      toc : true
      toc_sticky : true
      show_date: true   # 날짜 표기를 위해 추가
      read_time: false  # 기존에 true로 되어있어 false로 변경함
      comments: true
      share: true
      related: true
```

----
**references**

- [https://devinlife.com/blog/start-blog/](https://devinlife.com/blog/start-blog/)
- [http://alanwsmith.com/jekyll-liquid-date-formatting-examples](http://alanwsmith.com/jekyll-liquid-date-formatting-examples)