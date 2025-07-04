'use client';

import type { DetailedReport } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidationResultsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reports: DetailedReport[] | null;
}

export function ValidationResultsDialog({ isOpen, onOpenChange, reports }: ValidationResultsDialogProps) {
  if (!reports) {
    return null;
  }

  const defaultTab = reports.length > 0 ? reports[0].key : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Resultados da Verificação de Valores</DialogTitle>
          <DialogDescription>
            Análise detalhada da validação para cada coluna selecionada.
          </DialogDescription>
        </DialogHeader>
        {reports.length > 0 ? (
          <Tabs defaultValue={defaultTab} className="flex-grow flex flex-col min-h-0">
            <TabsList className="flex-shrink-0">
              {reports.map(report => (
                <TabsTrigger key={report.key} value={report.key}>
                  {report.columnName}
                  {report.summary.invalidRows > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {report.summary.invalidRows}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-grow mt-4 relative">
              <ScrollArea className="absolute inset-0 pr-6">
                {reports.map(report => (
                  <TabsContent key={report.key} value={report.key} className="m-0">
                    <div className="mb-4 text-sm space-y-1 p-4 border rounded-lg bg-secondary/50">
                      <p><strong>Planilha:</strong> {report.worksheetName}</p>
                      <p><strong>Total de Linhas:</strong> {report.summary.totalRows}</p>
                      <p className="font-semibold text-green-700"><strong>Linhas Válidas:</strong> {report.summary.validRows}</p>
                      <p className="font-semibold text-red-700"><strong>Linhas Inválidas:</strong> {report.summary.invalidRows}</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Linha</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-[120px] text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.results.map(row => (
                          <TableRow key={row.rowIndex}>
                            <TableCell>{row.rowIndex + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{row.value || <span className="text-muted-foreground italic">Vazio</span>}</TableCell>
                            <TableCell className="text-center">
                              {row.isValid ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                  Válido
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3.5 w-3.5" />
                                  Inválido
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </ScrollArea>
            </div>
          </Tabs>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum relatório de validação para exibir.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
