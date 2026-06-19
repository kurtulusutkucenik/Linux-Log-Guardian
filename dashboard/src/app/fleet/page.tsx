import { permanentRedirect } from 'next/navigation';

/** Filo ana ekran grafiklerle `/` — eski /fleet bookmark'lari buraya yonlenir */
export default function FleetPage() {
  permanentRedirect('/');
}
