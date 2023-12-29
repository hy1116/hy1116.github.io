/*
import logo from './logo.svg';
import './App.css';
import LoginForm from './loginForm';
*/
import './css/template.css';
import Info from './template/info';
import Img from './template/img';
import Text from './template/text';
import Calender from './template/calender';
import Map from './template/map';
import Gallery from './template/gallery';
import Attention from './template/attention';
import Comment from './template/comment';

function App() {
  const name = 'HyunYoung';
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className="invitation_con">
      <Info />
      </div>
    </div>
  );
}

export default App;
