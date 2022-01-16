---
title : "React - 리액트 프로젝트(1)"
category : "React"
tages : [React]
date : 2022-01-16T12:00:00
last_modified_at: 2022-01-16T12:00:00
---

## **Github페이지에 React추가하기**

### **1.준비**
- node.js 설치
https://nodejs.org/en/
- yarn 설치 : `brew install yarn`(homebrew) / `npm install -g yarn` (npm)
- gh-page 모듈 설치 : `npm install -save gh-pages`

### **2.gitpage폴더에 react-app생성**

```bash
npx create-react-app my-app
cd my-app
npm start
```

### 3. _*config.yml*

지킬 환경파일에 react파일 제외하기

```bash
exclude:
  - node_modules
  - dev-react-pages
```

### 4. homepage url 셋팅

추가한 react-app 폴더 내의 `package.json` 파일에 homepage 추가

```bash
"homepage": "/react-pages/"
```

### 5. 배포 스크립트 추가

`package.json` 에 배포스크립트 추가 (아래는 리눅스용)

```bash
"predeploy": "npm run build",
"purge": "rm -rf ../awesome-tools/static && cp -fR ./build/* ../awesome-tools",
"frontmatter": "echo '---\ntitle: Awesome Tools\nlayout: null\n---\n' | cat - ../awesome-tools/index.html > temp && mv temp ../awesome-tools/index.html",
"deploy": "npm run purge && npm run frontmatter"
```
- `predeploy` : 배포 전 `npm run build` 명령어로 빌드
- `purge` : 최근 빌드를 접근 가능한 지킬 폴더로 추가이동
- `deploy` : 배포!!

### 6. 배포
`yarn run deploy` 명령어로 빌드 후 결과를 배포 폴더로 옮긴다.

---
### TypeError: MiniCssExtractPlugin is not a constructor
TypeError: MiniCssExtractPlugin is not a constructor 에러 발생 시 아래 플러그인 설치
```bash
npm i -D --save-exact mini-css-extract-plugin@2.4.5
```

---

References

- [https://ko.reactjs.org/docs/create-a-new-react-app.html#create-react-app](https://ko.reactjs.org/docs/create-a-new-react-app.html#create-react-app)
- [https://donghyuna.github.io/react/jyikil,-reactsetup/](https://donghyuna.github.io/react/jyikil,-reactsetup/)
- [https://www.blandersoft.com/short/create-react-jekyll/](https://www.blandersoft.com/short/create-react-jekyll/)