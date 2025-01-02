import { useState, useEffect } from "react";
//import AddInputComment from "./addInputComment";


export default function MakeInput(props) {

    const { AddComment, onRendered } = props;
    //   console.log(`commentContainor: ${commentContainor} commentContainor.current: ${commentContainor.current}`)
    const [state, setState] = useState({ text: '' });

    useEffect(() => {
        if (onRendered) {
            onRendered();
        }
    }, []);

    const updateValue = e => {
        const newText = e.target.value;
        setState({
            ...state,
            text: newText
        });
    };
    const submitComment = () => {
        if (state.text) {
            AddComment({ newcomment: { name: 'Anonymous', body: state.text } });
            setState({ ...state, text: '' });
        }
    };
    return (
        <>
            <div className='inputBox'>
                <input value={state.text} type="text" className='inputBar' onChange={e => updateValue(e)} />
                <button className='submit' onClick={submitComment}>Submit Comment</button>
            </div>
        </>
    );
}