import NavHomeLink from "./navHomeLink";
import './navBar.css';

export default function NavBar({ text, homeLink }) {
    return (
        <div className='headerContainer'>
            {homeLink ? <NavHomeLink /> : null}
            <div className='header'>{text}</div>
        </div>
    );
}