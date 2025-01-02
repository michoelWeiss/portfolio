import { NavLink } from 'react-router';
export default function NavHomeLink() {
    return (
        <>
            <NavLink to='/'>
                <div className='navLink'>Blogger List</div>
            </NavLink>
        </>
    );
}