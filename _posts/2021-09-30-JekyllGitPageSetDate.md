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
```

## layout
- 나는 포스트의 레이아웃이 `single`로 되어있어 html을 확인해보니 `less than 1 minute read`가 찍히는 부분이 헤더에 include되어있는 `page__meta.html`에서 찍히는 것을 확인하고 수정해 주었다. (위치나 소스는 각자 다를 수 있음)
- `read_time`을 지우고 년 월 일 만 출력하기 위해 아래와 같이 작업함
```html
<!-- page__meta.html -->

```

----
**references**

- [https://devinlife.com/blog/start-blog/](https://devinlife.com/blog/start-blog/)
- [http://alanwsmith.com/jekyll-liquid-date-formatting-examples](http://alanwsmith.com/jekyll-liquid-date-formatting-examples)