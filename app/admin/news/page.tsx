'use client'

import { useState } from 'react'
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
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck, badge: '4' },
  { label: 'Singles', href: '/admin/singles', icon: UsersRound },
  { label: 'Parents', href: '/admin/parents', icon: Home },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'Maschilim', href: '/admin/maschilim', icon: BookOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
]

interface Article {
  id: string
  title: string
  releaseDate: string
  createdAt: string
  body: string
  imageUrl: string
}

const mockArticles: Article[] = [
  { id: '1', title: 'MyMatSH Spring 2026 Platform Update', releaseDate: 'Apr 20, 2026', createdAt: 'Apr 18, 2026', body: 'We are excited to announce several new features...', imageUrl: '' },
  { id: '2', title: 'New Shadchan Certification Program Launching', releaseDate: 'Apr 10, 2026', createdAt: 'Apr 8, 2026', body: 'Starting this month, all new shadchanim must complete...', imageUrl: '' },
  { id: '3', title: 'Purim 2026 Shadchan Appreciation Event Recap', releaseDate: 'Mar 18, 2026', createdAt: 'Mar 15, 2026', body: 'We gathered over 80 shadchanim in Lakewood to celebrate...', imageUrl: '' },
  { id: '4', title: 'Torah Singles Initiative Partnership Announcement', releaseDate: 'Mar 5, 2026', createdAt: 'Mar 3, 2026', body: 'MyMatSH is proud to partner with Torah Singles Initiative...', imageUrl: '' },
  { id: '5', title: 'January Platform Maintenance Complete', releaseDate: 'Jan 28, 2026', createdAt: 'Jan 25, 2026', body: 'All scheduled maintenance has been completed successfully...', imageUrl: '' },
]

interface ArticleForm {
  title: string
  releaseDate: string
  body: string
  imageUrl: string
}

const emptyForm: ArticleForm = { title: '', releaseDate: '', body: '', imageUrl: '' }

export default function AdminNewsPage() {
  const [articles, setArticles] = useState(mockArticles)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditingId(article.id)
    setForm({ title: article.title, releaseDate: article.releaseDate, body: article.body, imageUrl: article.imageUrl })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, title: form.title, releaseDate: form.releaseDate, body: form.body, imageUrl: form.imageUrl }
            : a
        )
      )
    } else {
      setArticles((prev) => [
        {
          id: String(Date.now()),
          title: form.title || 'Untitled',
          releaseDate: form.releaseDate || '—',
          createdAt: 'Apr 21, 2026',
          body: form.body,
          imageUrl: form.imageUrl,
        },
        ...prev,
      ])
    }
    setForm(emptyForm)
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id))
    setDeleteId(null)
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
                  <td className="table-td text-[#555555]">{article.releaseDate}</td>
                  <td className="table-td text-[#555555]">{article.createdAt}</td>
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Article' : 'Create Article'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-2 space-y-4">
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
                value={form.releaseDate}
                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
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
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Create Article'}
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
            <Button variant="secondary" size="md" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
