'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReportOptions } from '@/app/actions';


interface OperationOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onExecute: (options: ReportOptions) => void;
  operationId: string | null;
}

export function OperationOptionsDialog({ isOpen, onOpenChange, onExecute, operationId }: OperationOptionsDialogProps) {
  const [filterValue, setFilterValue] = useState('');

  const handleExecute = () => {
    const options: ReportOptions = {};
    const numValue = parseFloat(filterValue);
    if (operationId === 'compare-report-only' && !isNaN(numValue)) {
      options.filterLessThan = numValue;
    }
    onExecute(options);
    onOpenChange(false);
    setFilterValue('');
  };

  const isFilterVisible = operationId === 'compare-report-only';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opções da Operação</DialogTitle>
          <DialogDescription>
            Configure filtros ou opções antes de executar a operação.
          </DialogDescription>
        </DialogHeader>
        {isFilterVisible && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-less-than" className="col-span-4 text-left mb-2">
                Incluir no relatório apenas linhas onde o valor da planilha principal é menor que:
              </Label>
              <Input
                id="filter-less-than"
                type="number"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="col-span-4"
                placeholder="Ex: 100"
              />
            </div>
          </div>
        )}
        {!isFilterVisible && (
            <div className="py-4 text-sm text-muted-foreground">
                Esta operação não tem opções adicionais.
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExecute}>Executar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
