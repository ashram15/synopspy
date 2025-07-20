import logo from './assets/logo.png'
import './App.css'

export default function Header() {
    return (
        <header>
            <nav className="navBar">
                <a href="#main">
                    <img className="logoImg" src={logo} alt="logo"></img>
                </a>
                <ul>
                    <li><a href="#features">About</a></li>
                    <li><a href="#upload">Upload</a></li>
                </ul>
            </nav>
        </header>
    );
}