---
title : "React - React 시작하기"
category : "React"
tages : [React]
date : 2022-01-16T12:00:00
last_modified_at: 2022-01-16T12:00:00
---
## React 시작하기

[React - 리액트 프로젝트(1)](https://hy1116.github.io/react/AddReactProject/)

### React란?

리액트란 사용자인터페이스(UI)를 만들기 위한 Javascript라이브러리이다.

### React의 특징

1. **JSX 문법 사용**
    - 이렇게 작성된 JSX는 [babel](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.6&spec=false&loose=false&code_lz=GYVwdgxgLglg9mABACQKYBt1wBQEpEDeAUIohAgM5SIAWAhmACbqoDC6MEA1ogLyJ4-APkIlSiOiwBOUbAHIA7nCnpGc3GIC-YqaiggpSbGNIAeAEYgoUBIgTtOXXgXpMWD7pqEQO3UwHpLawQhMQ1NIA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=env%2Creact%2Cstage-2&prettier=false&targets=&version=7.10.2&externalPlugins=&assumptions=%7B%7D)을 통해 순수한 JS로 변환된다.
    
    ```jsx
    // jsx 문법 사용 안하는 경우
    class HelloMessage extends React.Component {
      render() {
        return React.createElement(
          "div",
          null,
          "Hello ",
          this.props.name
        );
      }
    }
    
    // jsx문법 사용한 경우
    class HelloMessage extends React.Component {
      render() {
        return (
          <div>
            Hello {this.props.name}
          </div>
        );
      }
    }
    ```
    
2. **Componant 기반 라이브러리**
    - 여러 부분을 분할 해서 코드의 재사용성과 유지보수성을 증가
3. **Virtual Dom**
    - 가상 돔은바뀌지 않은 부분과 바뀐 부분을 자동으로 감지해서 업데이트 시켜줌

### React 의 구조

1. `public` :  가상 DOM이 들어갈 빈 껍데기 html이 존재하는 폴더
2. `src` : 리액트 개발이 이루어지는 **메인 폴더**입니다. 

```bash
react-pages
├── README.md
├── node_modules
├── package.json
├── package-lock.json
├── .gitignore
├── public
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    └── serviceWorker.js
```

### App.js

```jsx
import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App"> /* HTML의 class속성과 동일하지만, javascript의 class에서 이미 사용하는 예약어이므로 코드안에서 사용불가 */
      <header className="App-header"> 
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
export default App;
```

1. **import문**
    - `React` 모듈을 불러올 때는 경로나 익스텐션을 쓰지 않음
    
    ```jsx
    import React from 'react'; // React 라이브러리 import (필수)
    import logo from './logo.svg';
    import './App.css'; 
    // from 사용 안함 : javaScript 모듈 구문이 아니라 웹팩(Webpack)으로부터 온 것
    // 웹 팩 : create-react-app이 우리의 모든 JavaScript 파일을 함께 번들하고 브라우저에 제공하기 위해 사용하는 도구
    ```
    
2. **App Component**
    - 대부분의 javascript라이브러리는 카멜케이스의 변수를 사용하지만, react컴포넌트는 **파스칼케이스의 변수**(첫 단어가 대문자로 시작하는 표기법) → React 컴포넌트이지, 정규 HTML 태그가 아니라는 것을 분명히 하기 위함
3. **Export문**
    - `export default App` : 다른 컴포넌트에서 `App` 컴포넌트를 사용할수 있도록함

### Index.js

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App'; //App.js에서 Export하여 사용가능
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

1. ReactDOM.render() : 리액트의 컴포넌트, 화면에 html 뷰를 생성해주는 역할
2. ReactDOM.render()의 두가지 인수
    - `<App />` : 렌더링 하길 원하는 컴포넌트
    - document.getElementById('root') : 렌더링 되길 원하는 요소

### 변수 와 props

1. 변수

```jsx
import logo from './logo.svg';

<img src={logo} className="App-logo" alt="logo" />
// {logo} : JSX가 변수를 인식하는 방법
// imoort된 logo를 가져와 렌더링함
```

```jsx
function App() {
	const name = 'hyunyoung'; // name 변수선언
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Hi, {name}! {/* name 변수 사용 */}
        </p>
      </header>
    </div>
  );
}
```

1. 컴포넌트 props

```jsx
ReactDOM.render(<App name="HyunYoung" />, document.getElementById('root'));
```

```jsx
function App(props) {
	console.log(props) /* Object { name: "HyunYoung" } */
	const name = props.name;
  return (
    // return statement
  );
}

```

- `prop` : react 컴포넌트에 전달되는 모든 데이터를 뜻함
- HTML의 요소는 속성을 가지고 있고, react컴포넌트는 `prop` 를 가진다.
- **React의 데이터 흐름은 단방향** : 부모 컴포넌트에서 자식 컴포넌트로 내려감
- props는 읽기 전용이다.

---

References

- [https://helloworld.kurly.com/blog/thinking-in-react/?utm_source=1055&utm_medium=unlimited&utm_keyword=all&utm_campaign=SA_Dynamic&gclid=Cj0KCQiAoY-PBhCNARIsABcz772rASauaCj95b5Etg4gOpIV9OJWUa2EZsHAWRXjykaAIGG65G10LxIaAtvCEALw_wcB](https://helloworld.kurly.com/blog/thinking-in-react/?utm_source=1055&utm_medium=unlimited&utm_keyword=all&utm_campaign=SA_Dynamic&gclid=Cj0KCQiAoY-PBhCNARIsABcz772rASauaCj95b5Etg4gOpIV9OJWUa2EZsHAWRXjykaAIGG65G10LxIaAtvCEALw_wcB)
- [https://developer.mozilla.org/ko/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started](https://developer.mozilla.org/ko/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started)
- [https://berkbach.com/기초부터-배우는-react-js-1531b18f7bb2](https://berkbach.com/%EA%B8%B0%EC%B4%88%EB%B6%80%ED%84%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-react-js-1531b18f7bb2)