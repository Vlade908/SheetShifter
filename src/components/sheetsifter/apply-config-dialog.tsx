
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ApplyConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  fileName: string | null;
}

export function ApplyConfigDialog({ isOpen, onOpenChange, onConfirm, fileName }: ApplyConfigDialogProps) {
  if (!fileName) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar Configuração Salva?</DialogTitle>
          <DialogDescription>
            Encontramos uma configuração salva para o arquivo <span className="font-semibold">{fileName}</span>. Para aplicá-la, envie o arquivo selecionado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Ok, Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
