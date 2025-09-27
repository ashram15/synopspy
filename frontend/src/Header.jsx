import logo from './assets/logo.png'
import './App.css'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'
import Profile from './Profile'

const Header = () => {
    return (
        <header>
            <nav className="navBar">
                <a href="#main">
                    <img className="logoImg" src={logo} alt="logo"></img>
                </a>
                <ul>
                    <li><a href="#features">About</a></li>
                    <li><a href="#upload">Upload</a></li>
                    <li>
                        <LoginButton />
                    </li>
                    <li>
                        <LogoutButton />
                    </li>
                    <li>
                        <Profile />
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;