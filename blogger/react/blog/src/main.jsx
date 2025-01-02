import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import CreateBloggers from './createBloggers.jsx';
import CreatePosts from './createPost.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}>
        <Route index={true} element={<CreateBloggers />}/>
        <Route path='/:bloggerId' element={<CreatePosts />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
