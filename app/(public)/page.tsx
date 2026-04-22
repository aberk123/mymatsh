import { notFound } from 'next/navigation'

// The / route is owned by app/page.tsx.
// This file must exist for the route group but must not compete for /.
export default function Page() {
  notFound()
}
