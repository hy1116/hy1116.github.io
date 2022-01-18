import logo from './logo.svg';
import './App.css';
import LoginForm from './loginForm';

function App() {
  const name = 'HyunYoung';
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Hi,{name}!
        </p>
        <LoginForm />
      </header>
    </div>
  );
}

export default App;
