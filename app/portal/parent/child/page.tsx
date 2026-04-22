'use client'

import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare, badge: '1' },
]

const profile = {
  first_name: 'Devorah',
  last_name: 'Cohen',
  full_hebrew_name: 'דבורה כהן',
  gender: 'Female',
  dob: 'March 14, 2001',
  age: 25,
  height_inches: 64,
  city: 'Lakewood',
  state: 'NJ',
  country: 'USA',
  phone: '(732) 555-0192',
  email: 'devorah.cohen@email.com',
  about_bio:
    'I am a warm and caring person who loves to learn and grow. I enjoy spending time with family, cooking, and volunteering in my community.',
  looking_for:
    'Someone who is kind, bnei Torah, and has a strong connection to family. I value someone who is growth-oriented and shares my love for a warm Jewish home.',
  family_background: 'Yeshivish/Modern; Father is a Rebbi, Mother is a nurse. Very warm family.',
  current_education: 'Completed seminary in Eretz Yisroel (2022)',
  occupation: 'Kindergarten teacher',
  hashkafa: 'Yeshivish',
  eretz_yisroel: 'Beth Rivkah Seminary, 2021–2022',
  high_school: 'Bais Yaakov of Lakewood',
  plans: 'Looking for a husband who will learn for a few years in kollel while she works.',
  references: [
    { name: 'Mrs. Esther Shapiro', phone: '(732) 555-0111', relation: 'Family friend' },
    { name: 'Mrs. Chana Rosen', phone: '(732) 555-0222', relation: 'Teacher' },
  ],
  status: 'available' as const,
}

function heightDisplay(inches: number) {
  const ft = Math.floor(inches / 12)
  const inc = inches % 12
  return `${ft}'${inc}"`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <p className="field-label mb-0.5">{label}</p>
      <p className="text-sm text-[#1A1A1A]">{value || '—'}</p>
    </div>
  )
}

export default function ParentChildProfilePage() {
  return (
    <AppLayout navItems={navItems} title="Child's Profile" role="parent">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={`${profile.first_name} ${profile.last_name}`} size="lg" />
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-sm text-[#555555]">{profile.city}, {profile.state}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={profile.status} />
            <span className="text-xs text-[#888888]">Age {profile.age}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
          <InfoRow label="Full Name" value={`${profile.first_name} ${profile.last_name}`} />
          <InfoRow label="Hebrew Name" value={profile.full_hebrew_name} />
          <InfoRow label="Gender" value={profile.gender} />
          <InfoRow label="Date of Birth" value={profile.dob} />
          <InfoRow label="Age" value={String(profile.age)} />
          <InfoRow label="Height" value={heightDisplay(profile.height_inches)} />
          <InfoRow label="City" value={`${profile.city}, ${profile.state}`} />
          <InfoRow label="Phone" value={profile.phone} />
          <InfoRow label="Email" value={profile.email} />
        </div>

        {/* Background & Education */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Background & Education</h3>
          <InfoRow label="Hashkafa" value={profile.hashkafa} />
          <InfoRow label="Family Background" value={profile.family_background} />
          <InfoRow label="High School" value={profile.high_school} />
          <InfoRow label="Eretz Yisroel / Seminary" value={profile.eretz_yisroel} />
          <InfoRow label="Current Education" value={profile.current_education} />
          <InfoRow label="Occupation" value={profile.occupation} />
          <InfoRow label="Future Plans" value={profile.plans} />
        </div>

        {/* About */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">About</h3>
          <p className="text-sm text-[#555555] leading-relaxed">{profile.about_bio}</p>
        </div>

        {/* Looking For */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">What She Is Looking For</h3>
          <p className="text-sm text-[#555555] leading-relaxed">{profile.looking_for}</p>
        </div>

        {/* References */}
        <div className="card xl:col-span-2">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">References</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.references.map((ref, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                <p className="text-sm font-semibold text-[#1A1A1A]">{ref.name}</p>
                <p className="text-xs text-[#888888] mt-0.5">{ref.relation}</p>
                <p className="text-xs text-[#555555] mt-0.5">{ref.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
