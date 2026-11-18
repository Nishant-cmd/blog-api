import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
const ADMIN_ORIGIN = new URL(ADMIN_URL).origin

function userFromToken(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)).user
  } catch { return null }
}

async function apiRequest(path, options = {}, token = '') {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || payload.errors?.[0]?.msg || 'The request could not be completed.')
  return payload
}

function App() {
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('blog-token') || '')
  const [dialog, setDialog] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', username: '', email: '', password: '' })
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const writerWindow = useRef(null)

  const user = useMemo(() => token ? userFromToken(token) : null, [token])

  useEffect(() => {
    function handleWriterMessage(event) {
      if (event.origin !== ADMIN_ORIGIN || event.data?.type !== 'BLOG_AUTH_REQUEST' || !event.source) return
      event.source.postMessage(
        token ? { type: 'BLOG_AUTH_TOKEN', token } : { type: 'BLOG_AUTH_REQUIRED' },
        ADMIN_ORIGIN,
      )
    }
    window.addEventListener('message', handleWriterMessage)
    return () => window.removeEventListener('message', handleWriterMessage)
  }, [token])

  useEffect(() => {
    let active = true
    apiRequest('/api/posts').then(({ data = [] }) => { if (active) setPosts(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedPost) return
    let active = true
    apiRequest(`/api/posts/${selectedPost.id}/comments`)
      .then(({ data = [] }) => { if (active) setComments(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setCommentsLoading(false) })
    return () => { active = false }
  }, [selectedPost])

  async function submitAuth(event) {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      if (dialog === 'signup') {
        await apiRequest('/api/users', { method: 'POST', body: JSON.stringify(authForm) })
      }
      const result = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: authForm.email.trim().toLowerCase(), password: authForm.password }) })
      localStorage.setItem('blog-token', result.token); setToken(result.token); setDialog('')
      setAuthForm({ name: '', username: '', email: '', password: '' })
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  function signOut() {
    if (writerWindow.current && !writerWindow.current.closed) {
      writerWindow.current.postMessage({ type: 'BLOG_SIGN_OUT' }, ADMIN_ORIGIN)
    }
    localStorage.removeItem('blog-token'); setToken(''); setDialog(''); setError('')
  }

  function openWriter() {
    writerWindow.current = window.open(ADMIN_URL, '_blank')
    if (!writerWindow.current) setError('Allow pop-ups for this site to open the writing dashboard.')
  }

  function openPost(post) {
    setSelectedPost(post); setComments([]); setCommentsLoading(true); setCommentText(''); setError('')
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!user?.id || !selectedPost) { setError('Please sign in again to comment.'); return }
    setSaving(true); setError('')
    try {
      const { data } = await apiRequest(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST', body: JSON.stringify({ content: commentText }),
      }, token)
      setComments((current) => [data, ...current]); setCommentText('')
      setPosts((current) => current.map((post) => post.id === selectedPost.id ? { ...post, _count: { ...post._count, comments: (post._count?.comments || 0) + 1 } } : post))
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  return (
    <main className="blog-app">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setSelectedPost(null)}>Blog</a>
        <nav className="nav-actions" aria-label="Main navigation">
          <button className="write-link" onClick={openWriter} aria-label="Write a post"><span className="write-icon" aria-hidden="true">↗</span><span>Write</span></button>
          {user ? <><span className="nav-user">{user.name || user.username}</span><button className="nav-link" onClick={signOut}>Log out</button></> : <>
            <button className="nav-link" onClick={() => { setDialog('login'); setError('') }}>Login</button>
            <button className="signup-button" onClick={() => { setDialog('signup'); setError('') }}>Sign Up</button>
          </>}
        </nav>
      </header>

      {selectedPost ? <article className="story-page">
        <button className="back-link" onClick={() => { setSelectedPost(null); setError('') }}>← Back to latest stories</button>
        <div className="story-detail"><p className="story-byline">By {selectedPost.author?.name || selectedPost.author?.username || 'Blog author'} <span>·</span> {new Date(selectedPost.publishedAt || selectedPost.createdAt).toLocaleDateString()}</p>
          <h1>{selectedPost.title}</h1><div className="story-content">{selectedPost.content}</div>
        </div>
        <section className="comments-panel" aria-label="Comments"><div className="comments-title"><h2>Comments</h2><span>{comments.length}</span></div>
          {error && <p className="message error-message" role="alert">{error}</p>}
          {user ? <form className="comment-form" onSubmit={submitComment}><label className="sr-only" htmlFor="comment-text">Write a comment</label><textarea id="comment-text" required rows="3" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Share your thoughts…" /><button className="primary-button" disabled={saving}>{saving ? 'Posting…' : 'Post comment'}</button></form>
            : <p className="signin-prompt">Want to join the conversation? <button onClick={() => { setDialog('login'); setError('') }}>Log in</button> or <button onClick={() => { setDialog('signup'); setError('') }}>create an account</button>.</p>}
          {commentsLoading ? <p className="muted">Loading comments…</p> : comments.length ? comments.map((comment) => <article className="comment-item" key={comment.id}><div className="comment-meta"><strong>{comment.author?.name || comment.author?.username || 'Reader'}</strong><time>{new Date(comment.createdAt).toLocaleDateString()}</time></div><p>{comment.content}</p></article>) : <p className="muted">No comments yet. Be the first to respond.</p>}
        </section>
      </article> : <>
        <section className="hero"><h1>Latest Stories</h1><p>Discover ideas, stories, and perspectives from writers around the world.</p></section>
        <section className="feed" aria-label="Latest stories">
          {error && <p className="message error-message" role="alert">{error}</p>}
          {loading ? <div className="skeleton-list" aria-label="Loading posts"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>
            : posts.length ? <div className="story-list">{posts.map((post) => <button className="story-card" key={post.id} onClick={() => openPost(post)}>
              <span className="story-byline">By {post.author?.name || post.author?.username || 'Blog author'} <span>·</span> {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              <span className="story-title">{post.title}</span><span className="story-excerpt">{post.content.slice(0, 220)}{post.content.length > 220 ? '…' : ''}</span>
              <span className="story-footer">Read story <span>·</span> {post._count?.comments || 0} comments</span>
            </button>)}</div> : <p className="empty-state">There are no published posts yet.</p>}
        </section>
      </>}
      <footer className="site-footer"><span>Blog</span><span>Stories from our community.</span></footer>

      {dialog && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog('') }}>
        <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="dialog-close" aria-label="Close" onClick={() => setDialog('')}>×</button>
          <p className="dialog-brand">Blog</p><h2 id="auth-title">{dialog === 'signup' ? 'Join the conversation' : 'Welcome back'}</h2>
          <p className="muted">{dialog === 'signup' ? 'Create an account to comment and write.' : 'Sign in to comment on stories.'}</p>
          {error && <p className="message error-message" role="alert">{error}</p>}
          <form className="auth-form" onSubmit={submitAuth}>
            {dialog === 'signup' && <><label>Name<input required maxLength="100" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Username<input required minLength="1" maxLength="10" pattern="[A-Za-z0-9]+" value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} /></label></>}
            <label>Email<input required type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Password<input required type="password" minLength="8" autoComplete={dialog === 'signup' ? 'new-password' : 'current-password'} value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} />{dialog === 'signup' && <small>At least 8 characters, including one uppercase letter and one number.</small>}</label>
            <button className="primary-button auth-submit" disabled={saving}>{saving ? 'Please wait…' : dialog === 'signup' ? 'Create account' : 'Login'}</button>
          </form>
          <p className="auth-switch">{dialog === 'signup' ? 'Already have an account?' : 'New to Blog?'} <button onClick={() => { setDialog(dialog === 'signup' ? 'login' : 'signup'); setError('') }}>{dialog === 'signup' ? 'Login' : 'Sign up'}</button></p>
        </section>
      </div>}
    </main>
  )
}

export default App
