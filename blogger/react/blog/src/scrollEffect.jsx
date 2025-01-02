export default async function ScrollEffect({ fullCommentContainerRef, scrollDown, height }) {

    if (scrollDown) {
        if(height && fullCommentContainerRef.current){
            fullCommentContainerRef.current.style.maxHeight = `${height}px`;
        }
        
    }
    else if(!scrollDown) {
        if (fullCommentContainerRef.current)
            fullCommentContainerRef.current.style.maxHeight = "0px";
    }

}