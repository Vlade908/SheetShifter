
'use client';

import SheetSifterApp from "@/components/sheetsifter/sheet-sifter-app";
import withAuth from "@/components/with-auth";

function HomePage() {
  return (
    <SheetSifterApp pageKey="subsidio"/>
  );
}

export default withAuth(HomePage);
