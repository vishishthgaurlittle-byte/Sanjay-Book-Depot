import { redirect } from 'next/navigation';

/** /admin → straight into the admin workspace (auth is enforced by each page). */
export default function AdminIndex() {
  redirect('/admin/products');
}
