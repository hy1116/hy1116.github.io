---
title : "GitPage - Post 날짜 표기 "
category : "GitPage"
tages : [GitPage,Jekyll]
date : 2021-09-30T12:00:00
last_modified_at: 2021-09-30T12:00:00
comment : true
---

### Post 날짜 표기
## before
- 아래와 같이 포스트들에 `less than 1 minute read`로 표기되는 부분이 거슬려져서 변경하려함.
<img src="/assets/images/posts/addDateImage1.png" alt="image-20201024170236744" class="image-shadow-card" />

## post yaml
- 일단 포스트들의 `YAML Front Matter`에 입력된 변수에 date가 있어야 한다.
```yaml
title : "GitPage - Post 날짜 표기 "
category : "GitPage"
tages : [GitPage,Jekyll]
date : 2021-09-30T12:00:00
last_modified_at: 2021-09-30T12:00:00
comment : true
show_date: true
read_time: false
```

## layout
- 나는 포스트의 레이아웃이 `single`로 되어있어 html을 확인해보니 `less than 1 minute read`가 찍히는 부분이 헤더에 include되어있는 `page__meta.html`에서 찍히는 것을 확인하고 수정해 주었다. (위치나 소스는 각자 다를 수 있음)
- `read_time`을 지우고 년 월 일 만 출력하기 위해 아래와 같이 작업함
```html
<!-- page__meta.html -->
{% row %}
{% assign document = post | default: page %}
{% if document.read_time or document.show_date %}
  <p class="page__meta">
    {{document.show_date}}{{document.date}}
    {% if document.show_date and document.date %}
      {% assign date = document.date %}
      <span class="page__meta-date">
        <i class="far {% if include.type == 'grid' and document.read_time and document.show_date %}fa-fw {% endif %}fa-calendar-alt" aria-hidden="true"></i>
        <!-- 원하는 date format으로 변경 -->
        <time datetime="{{ date | date_to_xmlschema }}">{{ date | date: "%Y %m %d" }}</time>
      </span>
    {% endif %}

    {% if document.read_time and document.show_date %}<span class="page__meta-sep"></span>{% endif %}
    <!--

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
    -->
  </p>
{% endif %}
{% endrow %}
```

----
**references**

- [https://devinlife.com/blog/start-blog/](https://devinlife.com/blog/start-blog/)
- [http://alanwsmith.com/jekyll-liquid-date-formatting-examples](http://alanwsmith.com/jekyll-liquid-date-formatting-examples)