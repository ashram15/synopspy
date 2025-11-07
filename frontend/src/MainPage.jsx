import './App.css'
import './styles/modern.css'
import oandp from './assets/oandp.png'

const MainPage = () => {
    return (
        <section id="main">
            <div className="logo-container fadeInImg">
                <div className="logo-text">
                    <span className="syn">Syn</span>
                    <img src={oandp} alt="o and p" className="op-image" />
                    <span className="spy">Spy</span>
                </div>
                <div className="logo-subtitle">Document Analysis Made Simple</div>
            </div>
        </section>
    );
}

export default MainPage;