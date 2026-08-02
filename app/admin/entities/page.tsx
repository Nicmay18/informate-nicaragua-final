import { redirect } from 'next/navigation';

export default function AdminEntitiesRedirect() {
  redirect('/panel/entities');
}
