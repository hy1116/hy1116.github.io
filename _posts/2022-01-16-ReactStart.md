---
title : "React - 리액트 프로젝트(1)"
category : "React"
tages : [React]
date : 2022-01-16T12:00:00
last_modified_at: 2022-01-16T12:00:00
---
## React 시작하기

### React의 특징

1. **JSX 문법 사용**
    
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
    
2. Componant 기반 라이브러리
    - 여러 부분을 분할 해서 코드의 재사용성과 유지보수성을 증가
3. Virtual Dom
    - 가상 돔은바뀌지 않은 부분과 바뀐 부분을 자동으로 감지해서 업데이트 시켜줌

### React 의 구조

```bash
moz-todo-react
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

---

References

- [https://berkbach.com/기초부터-배우는-react-js-1531b18f7bb2](https://berkbach.com/%EA%B8%B0%EC%B4%88%EB%B6%80%ED%84%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-react-js-1531b18f7bb2)