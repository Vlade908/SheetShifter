
'use client';

import SheetSifterApp from "@/components/sheetsifter/sheet-sifter-app";
import withAuth from "@/components/with-auth";

function PassePage() {
  return (
    <SheetSifterApp pageKey="passe" />
  );
}

export default withAuth(PassePage);
