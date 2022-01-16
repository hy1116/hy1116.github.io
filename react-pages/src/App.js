import logo from './logo.svg';
import './App.css';

function App() {
  const name = 'HyunYoung';
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Hi,{name}!
        </p>
      </header>
    </div>
  );
}

export default App;
