import { useState, useEffect } from "react";
import GetBloggers from "./getBloggers";
import MakeBlogger from "./makeBlogger";
import NavBar from './navBar.jsx';
import './bloggers.css';

export default function CreateBloggers() {
    const [bloggers, setBloggers] = useState([]);

    useEffect(() => {

        async function fetchBloggers() {
            const data = await GetBloggers(); // Assuming GetBloggers fetches and returns an array
            setBloggers(data);
        }
        
        fetchBloggers();
    }, []);

    return (
        <>
        
            <div id='bloggerBody'>
                <NavBar text='Blogger Hub' homeLink={false}/>
                {bloggers.map(user => <MakeBlogger blogger={user} />)}
            </div>
        </>);
}