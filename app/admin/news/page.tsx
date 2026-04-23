'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck },
  { label: 'Singles', href: '/admin/singles', icon: UsersRound },
  { label: 'Parents', href: '/admin/parents', icon: Home },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'Maschilim', href: '/admin/maschilim', icon: BookOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  { label: 'Import Batches', href: '/admin/import-batches', icon: PackageOpen },
]

interface Article {
  id: string
  title: string
  body: string
  image_url: string | null
  release_date: string
  created_at: string
}

interface ArticleForm {
  title: string
  release_date: string
  body: string
  image_url: string
}

const emptyForm: ArticleForm = { title: '', release_date: '', body: '', image_url: '' }

export default function AdminNewsPage() {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/news')
      if (res.ok) {
        const data = await res.json() as Article[]
        setArticles(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSaveError('')
    setDialogOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditingId(article.id)
    setForm({
      title: article.title,
      release_date: article.release_date,
      body: article.body,
      image_url: article.image_url ?? '',
    })
    setSaveError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/news/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            body: form.body,
            release_date: form.release_date,
            image_url: form.image_url,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const updated = await res.json() as Article
        setArticles((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const res = await fetch('/api/admin/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            body: form.body,
            release_date: form.release_date,
            image_url: form.image_url,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const newArticle = await res.json() as Article
        setArticles((prev) => [newArticle, ...prev])
      }
      setForm(emptyForm)
      setDialogOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setArticles((prev) => prev.filter((a) => a.id !== id))
      setDeleteId(null)
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const deletingTitle = articles.find((a) => a.id === deleteId)?.title ?? ''

  return (
    <AppLayout navItems={navItems} title="News" role="platform_admin">
      <div className="flex justify-end mb-4">
        <Button variant="primary" size="md" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Article
        </Button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Title</th>
                  <th className="table-th">Release Date</th>
                  <th className="table-th">Created At</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A] max-w-xs truncate">{article.title}</td>
                    <td className="table-td text-[#555555]">
                      {new Date(article.release_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td text-[#555555]">
                      {new Date(article.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(article)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1"
                          onClick={() => setDeleteId(article.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-[#888888] py-8">
                      No articles yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Article' : 'Create Article'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-2 space-y-4">
            {saveError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                {saveError}
              </div>
            )}
            <div>
              <Label className="field-label">Title</Label>
              <Input
                placeholder="Article title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">Release Date</Label>
              <Input
                type="date"
                value={form.release_date}
                onChange={(e) => setForm({ ...form, release_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">Body</Label>
              <Textarea
                placeholder="Write the article content here..."
                rows={5}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1A1A1A]">&ldquo;{deletingTitle}&rdquo;</span>?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={deleting}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {deleting ? 'Deleting…' : 'Delete Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
