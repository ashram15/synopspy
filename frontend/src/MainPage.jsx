import mainLogo from './assets/SynopSpy.png'
import './App.css'
import './styles/modern.css'

const MainPage = () => {
    return (
        <section id="main">
            <div className="fadeInImg">
                <img src={mainLogo} alt="Synopspy logo"></img>
            </div>
        </section>
    );
}

export default MainPage;