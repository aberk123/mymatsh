export interface MockOrg {
  id: string
  name: string
  city: string
  email: string
  primaryContact: string
  members: number
  approved: boolean
  createdAt: string
}

export const mockOrgs: MockOrg[] = [
  { id: '1', name: "Yad L'Bachur", city: 'Lakewood, NJ', email: 'info@yadlbachur.org', primaryContact: 'Rabbi Yosef Stern', members: 48, approved: true, createdAt: 'Jan 5, 2026' },
  { id: '2', name: 'Shadchan Network', city: 'Brooklyn, NY', email: 'contact@shadchannetwork.com', primaryContact: 'Mrs. Chana Friedman', members: 112, approved: true, createdAt: 'Jan 12, 2026' },
  { id: '3', name: 'Torah Singles Initiative', city: 'Monsey, NY', email: 'admin@torahsingles.org', primaryContact: 'Rabbi Moshe Weiss', members: 76, approved: true, createdAt: 'Feb 1, 2026' },
  { id: '4', name: 'Simcha Connect', city: 'Chicago, IL', email: 'hello@simchaconnect.org', primaryContact: 'Devorah Katz', members: 31, approved: false, createdAt: 'Feb 20, 2026' },
  { id: '5', name: "Kol B'Ramah Foundation", city: 'Baltimore, MD', email: 'info@kolbramah.org', primaryContact: 'Rabbi Avraham Levy', members: 55, approved: true, createdAt: 'Mar 3, 2026' },
  { id: '6', name: 'Binyan Bayit Society', city: 'Teaneck, NJ', email: 'contact@binyanbayit.org', primaryContact: 'Sarah Horowitz', members: 20, approved: false, createdAt: 'Mar 18, 2026' },
]
