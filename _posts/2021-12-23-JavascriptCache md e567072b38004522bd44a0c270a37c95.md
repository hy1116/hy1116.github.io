---
title : "Javascript - block Cache"
category : "Javascript"
tages : [javascript,cache]
date : 2021-12-23T12:00:00
last_modified_at: 2021-12-23T12:00:00
---

# 2021-12-23-JavascriptCache.md

### js 로드 시 브라우저 캐시 방지 방법

- url 뒤에 timestamp를 붙여줌
- 쿼리스트링을 포함한 URL기준으로 캐시되므로 다른파일로 인식함

```html
<!-- before -->
<script type="text/javascript" src="/javascript/~~~.js">
<!-- after -->
<script type="text/javascript" src="/javascript/~~~.js?20211223135496">
```