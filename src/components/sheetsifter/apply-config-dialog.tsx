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
          <DialogTitle>Configuração Encontrada</DialogTitle>
          <DialogDescription>
            Encontramos uma configuração salva para o arquivo <span className="font-semibold">{fileName}</span>. Deseja aplicá-la?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Não</Button>
          <Button onClick={handleConfirm}>Sim, Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
