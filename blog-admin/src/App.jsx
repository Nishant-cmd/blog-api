import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const CLIENT_ORIGIN = new URL(import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173').origin
const EMPTY_FORM = { title: '', slug: '', content: '' }

function userFromToken(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)).user
  } catch { return null }
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || payload.errors?.[0]?.msg || 'The request could not be completed.')
  return payload
}

function App() {
  const [token, setToken] = useState(() => {
    if (window.opener) return ''
    return localStorage.getItem('blog-admin-token') || ''
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [posts, setPosts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [comments, setComments] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const currentUser = useMemo(() => token ? userFromToken(token) : null, [token])

  useEffect(() => {
    function handlePublicMessage(event) {
      if (event.origin !== CLIENT_ORIGIN || event.source !== window.opener) return
      if (event.data?.type === 'BLOG_AUTH_TOKEN' && typeof event.data.token === 'string') {
        localStorage.setItem('blog-admin-token', event.data.token)
        setToken(event.data.token); setError('')
      }
      if (event.data?.type === 'BLOG_AUTH_REQUIRED' || event.data?.type === 'BLOG_SIGN_OUT') {
        localStorage.removeItem('blog-admin-token')
        setToken(''); setPosts([]); setSelectedId(null)
      }
    }
    window.addEventListener('message', handlePublicMessage)
    if (window.opener) window.opener.postMessage({ type: 'BLOG_AUTH_REQUEST' }, CLIENT_ORIGIN)
    return () => window.removeEventListener('message', handlePublicMessage)
  }, [])

  const loadDashboard = useCallback(async (activeToken) => {
    setLoading(true); setError('')
    try {
      const postResponse = await apiRequest('/api/posts/admin/all', activeToken)
      setPosts(postResponse.data || [])
    } catch (requestError) {
      setError(requestError.message)
      if (/unauthorized|token/i.test(requestError.message)) signOut()
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (token) Promise.resolve().then(() => loadDashboard(token))
  }, [token, loadDashboard])

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedId) || null, [posts, selectedId])

  useEffect(() => {
    if (!selectedPost) return
    apiRequest(`/api/posts/${selectedPost.id}/comments`, token)
      .then(({ data = [] }) => setComments(data))
      .catch((requestError) => setError(requestError.message))
  }, [selectedPost, token])

  async function signIn(event) {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      const result = await apiRequest('/api/auth/login', '', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) })
      localStorage.setItem('blog-admin-token', result.token); setToken(result.token); setPassword('')
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  function signOut() {
    localStorage.removeItem('blog-admin-token'); setToken(''); setPosts([]); setSelectedId(null); setNotice('')
  }

  async function savePost(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    const isEditing = Boolean(selectedId)
    const body = { ...form }
    try {
      const result = await apiRequest(isEditing ? `/api/posts/${selectedId}` : '/api/posts', token, {
        method: isEditing ? 'PUT' : 'POST', body: JSON.stringify(body),
      })
      if (isEditing) setPosts((current) => current.map((post) => post.id === selectedId ? { ...post, ...result.data } : post))
      else { setPosts((current) => [result.data, ...current]); setSelectedId(result.data.id) }
      setNotice(isEditing ? 'Post saved.' : 'Draft created.')
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  async function togglePublished(post) {
    setError(''); setNotice('')
    try {
      const { data } = await apiRequest(`/api/posts/${post.id}`, token, { method: 'PUT', body: JSON.stringify({ published: !post.published }) })
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, ...data } : item))
      setNotice(data.published ? 'Post published.' : 'Post moved back to drafts.')
    } catch (requestError) { setError(requestError.message) }
  }

  async function deletePost(post) {
    if (!window.confirm(`Delete “${post.title}” and its comments permanently?`)) return
    setError(''); setNotice('')
    try {
      await apiRequest(`/api/posts/${post.id}`, token, { method: 'DELETE' })
      setPosts((current) => current.filter((item) => item.id !== post.id))
      if (selectedId === post.id) { setSelectedId(null); setForm(EMPTY_FORM) }
      setNotice('Post deleted.')
    } catch (requestError) { setError(requestError.message) }
  }

  async function editComment(comment) {
    const content = window.prompt('Edit this comment:', comment.content)
    if (content === null || !content.trim()) return
    try {
      await apiRequest(`/api/posts/${selectedId}/comments/${comment.id}`, token, { method: 'PUT', body: JSON.stringify({ content: content.trim() }) })
      const { data = [] } = await apiRequest(`/api/posts/${selectedId}/comments`, token)
      setComments(data); setNotice('Comment updated.')
    } catch (requestError) { setError(requestError.message) }
  }

  async function deleteComment(comment) {
    if (!window.confirm('Delete this comment?')) return
    try {
      await apiRequest(`/api/posts/${selectedId}/comments/${comment.id}`, token, { method: 'DELETE' })
      setComments((current) => current.filter((item) => item.id !== comment.id)); setNotice('Comment deleted.')
    } catch (requestError) { setError(requestError.message) }
  }

  if (!token) return <main className="login-page"><form className="login-card" onSubmit={signIn}>
    <p className="eyebrow">Blog · Write</p><h1>Welcome back.</h1><p className="muted">Sign in to write and manage posts.</p>
    {error && <p className="alert" role="alert">{error}</p>}
    <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    <button className="button primary full" disabled={saving}>{saving ? 'Signing in…' : 'Sign in'}</button>
  </form></main>

  return <main className="admin-shell">
    <header className="topbar"><a className="brand" href="#dashboard">Blog <small>Write</small></a><div className="top-actions"><span className="muted">{currentUser?.name || currentUser?.username || 'Content dashboard'}</span><button className="button quiet" onClick={signOut}>Sign out</button></div></header>
    <div className="workspace">
      <aside className="sidebar"><div className="sidebar-title"><div><p className="eyebrow">Dashboard</p><h2>Posts</h2></div><button className="button primary" onClick={() => { setSelectedId(null); setForm(EMPTY_FORM); setNotice(''); setError('') }}>+ New post</button></div>
        <div className="post-list">{posts.map((post) => <button className={`post-row ${selectedId === post.id ? 'active' : ''}`} key={post.id} onClick={() => { setSelectedId(post.id); setForm({ title: post.title, slug: post.slug, content: post.content }); setComments([]); setNotice(''); setError('') }}>
          <span className="post-row-title">{post.title}</span><span className="post-row-meta"><i className={post.published ? 'dot published' : 'dot'} />{post.published ? 'Published' : 'Draft'} · {post._count?.comments || 0} responses</span>
        </button>)}</div>
        {loading && <p className="muted sidebar-empty">Loading posts…</p>}{!loading && posts.length === 0 && <p className="muted sidebar-empty">No posts yet. Start with a new draft.</p>}
      </aside>

      <section className="editor">
        <div className="editor-heading"><div><p className="eyebrow">{selectedPost ? (selectedPost.published ? 'Published story' : 'Draft') : 'Create'}</p><h1>{selectedPost ? 'Edit story' : 'New story'}</h1></div>
          {selectedPost && <div className="heading-actions"><button className="button" onClick={() => togglePublished(selectedPost)}>{selectedPost.published ? 'Unpublish' : 'Publish'}</button><button className="button danger" onClick={() => deletePost(selectedPost)}>Delete</button></div>}
        </div>
        {error && <p className="alert" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
        <form className="post-form" onSubmit={savePost}>
          <label>Title<input required maxLength="255" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="A title worth remembering" /></label>
          <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Use lowercase letters, numbers, and hyphens." value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="a-title-worth-remembering" /></label>
          <label>Story<textarea required rows="15" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write your story…" /></label>
          <div className="form-footer"><span className="muted">{selectedPost?.published ? 'Changes save to the published story.' : 'New stories start as drafts.'}</span><button className="button primary" disabled={saving}>{saving ? 'Saving…' : selectedPost ? 'Save changes' : 'Create draft'}</button></div>
        </form>

        {selectedPost && <section className="moderation"><div className="moderation-heading"><h2>Responses</h2><span>{comments.length}</span></div>
          {comments.length ? comments.map((comment) => <article className="moderation-row" key={comment.id}><div className="comment-copy"><strong>{comment.author?.name || 'Reader'}</strong><time>{new Date(comment.createdAt).toLocaleString()}</time><p>{comment.content}</p></div><div className="comment-actions"><button className="text-action" onClick={() => editComment(comment)}>Edit</button><button className="text-action danger-text" onClick={() => deleteComment(comment)}>Delete</button></div></article>) : <p className="muted empty-comments">No responses on this story yet.</p>}
        </section>}
      </section>
    </div>
  </main>
}

export default App
