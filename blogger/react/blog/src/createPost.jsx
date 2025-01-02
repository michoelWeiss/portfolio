import { useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import GetBloggers from './getBloggers';
import NavBar from './navBar';
import MakePost from './makePost';
import GetPosts from './getPost';
import './post.css';

export default function CreatePosts() {

    const { bloggerId } = useParams();
    const [posts, setPosts] = useState([]);
    const [name, setName] = useState([]);

    useEffect(() => {
        async function fetchPosts() {
            try {
                if (bloggerId) {
                    const data = await GetPosts(bloggerId);
                    setPosts(data);
                    const tempName = await GetBloggers();
                    if (tempName) {
                        tempName.forEach(element => {
                            if (element.id === Number(bloggerId))
                                setName(element.name);
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        fetchPosts();
    }, [bloggerId]);
    return (
        <>
        <div id='postAndCommentsBody'>
            <NavBar text={name} homeLink={true}/>
            {posts && posts.length > 0 && posts.map(p => <MakePost key={p.id} post={p} />)}
        </div>
        </>
    );
}