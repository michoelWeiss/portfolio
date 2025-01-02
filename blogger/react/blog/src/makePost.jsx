import CreateComments from "./createComments";
import MakeInput from "./makeInput";
import ScrollEffect from "./scrollEffect";
import { useState, useEffect, useRef } from "react";
import MakeComment from "./makecomments";
import './comments.css';
import './input.css';

export default function MakePost({ post }) {

    const { title, body, id } = post;
    const fullCommentContainerRef = useRef(null);
    const commentContainerRef = useRef(null);
    const [isContentLoaded, setIsContentLoaded] = useState({ comments: false, input: false });
    const [addComent, setAddComent] = useState({ flag: false, comments: [] });
    const [state, setDisplayComments] = useState(
        {
            displayComments: false,
            buttonText: 'Show Comments',
            isDisabled: false,
            scrollUp: false
        });

    const handleAddComment = ({newcomment}) => {
        if (newcomment) {
            const temp = addComent.comments;
            temp.push(newcomment);
            setAddComent({ ...addComent, flag: true, comments: temp });
        }
    };

    useEffect(() => {
        async function scrollDown() {
            if (isContentLoaded.comments && isContentLoaded.input) {
                await ScrollEffect({ fullCommentContainerRef, scrollDown: true, height: commentContainerRef.current.scrollHeight });
            }
        }
        scrollDown();
    }, [isContentLoaded.comments, isContentLoaded.input]);

    const updateisContentLoaded = update => {
        setIsContentLoaded({
            ...isContentLoaded,
            [update]: true
        });
    };
    const handleComments = async () => {
        const newText = (state.buttonText === 'Show Comments' ? 'Remove Comments' : 'Show Comments');

        setDisplayComments((prevState) => ({
            ...prevState,
            buttonText: newText,
        }));

        if (!state.scrollUp) {
            setDisplayComments((prevState) => ({
                ...prevState,
                isDisabled: true,
                displayComments: true,
            }));
        }
        else {
            await ScrollEffect({ fullCommentContainerRef, scrollDown: false });
        }
    };

    const transitionEnd = async () => {
        let display = true;
        if (state.scrollUp) {
            display = false;
            setIsContentLoaded({ comments: false, input: false });
        }
        setDisplayComments({
            ...state,
            displayComments: display,
            scrollUp: !state.scrollUp,
            isDisabled: false
        });
    };

    return (
        <>
            <div className='postbody'>
                <div className='postTitle'>{title}</div>
                <div className='postContent'>{body}</div>
                <button
                    className='commentButt'
                    onClick={handleComments}
                    disabled={state.isDisabled}
                >
                    {state.buttonText}
                </button>
                <div className='fullcommentContainor' ref={fullCommentContainerRef} onTransitionEnd={transitionEnd}>
                    {state.displayComments ?
                        <>
                            <div className='commentContainor' ref={commentContainerRef} >
                                {addComent.flag && addComent.comments.map( (currentComment, index) => <MakeComment key={index} comment={currentComment}/>)}
                                <CreateComments id={id} onRendered={() => updateisContentLoaded('comments')} />
                            </div>
                            <MakeInput AddComment={handleAddComment} onRendered={() => updateisContentLoaded('input')} />
                        </>
                        : null}
                </div>
            </div>
        </>
    );

}