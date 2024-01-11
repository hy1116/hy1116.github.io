import './css/template.css';
import Info from './template/info';
import Img from './template/img';
import Text from './template/text';
import Cal from './template/calender';
import Map from './template/map';
import Gallery from './template/gallery';
import Attention from './template/attention';
import Comment from './template/comment';


function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className="invitation_con">
        <Info />
        <Img />
        <Text />
        <Cal />
        <Map />
        <Gallery />
        <Attention />
        <Comment />        
      </div>
    </div>
  );
}

export default App;
