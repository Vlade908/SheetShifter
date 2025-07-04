'use client';

import { useState, useTransition } from 'react';
import type { DetailedReport, Selection, SpreadsheetData, DataType } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Download, LoaderCircle } from 'lucide-react';
import { compareAndCorrectAction, ReportOptions } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { parseCurrency } from '@/lib/utils';


interface ValidationResultsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reports: DetailedReport[] | null;
  spreadsheetData: SpreadsheetData | null;
  selections: Selection[];
  primaryWorksheetName: string | null;
  reportOptions: ReportOptions;
}

export function ValidationResultsDialog({ isOpen, onOpenChange, reports, spreadsheetData, selections, primaryWorksheetName, reportOptions }: ValidationResultsDialogProps) {
  const { toast } = useToast();
  const [isDownloading, startDownloading] = useTransition();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const formatValue = (value: string | undefined | null, dataType: DataType | undefined): string => {
    if (dataType !== 'currency' || value === null || value === undefined || String(value).trim() === '') {
      return value || '';
    }
    const numericValue = parseCurrency(value);
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return value;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue);
  };

  const handleDownload = async (targetWorksheet: string) => {
    if (!spreadsheetData || !primaryWorksheetName || selections.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Dados necessários para a correção estão faltando.' });
      return;
    }
    setDownloadingKey(targetWorksheet);
    startDownloading(async () => {
      try {
        const correctedFiles = await compareAndCorrectAction(
          spreadsheetData,
          selections,
          primaryWorksheetName,
          targetWorksheet,
          reportOptions
        );

        if (correctedFiles.length > 0) {
          const file = correctedFiles[0];
          const link = document.createElement('a');
          link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${file.content}`;
          link.download = file.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({ title: 'Download Iniciado', description: `O arquivo ${file.fileName} foi baixado.` });
        } else {
          toast({ title: 'Nenhuma Correção Necessária', description: `A planilha ${targetWorksheet} já está correta ou nenhuma linha atendeu aos critérios.` });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro durante a correção.';
        toast({ variant: 'destructive', title: 'Erro na Correção', description: errorMessage });
      } finally {
        setDownloadingKey(null);
      }
    });
  };
  
  if (!reports) {
    return null;
  }

  const defaultTab = reports.length > 0 ? reports[0].key : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">Resultados da Verificação</DialogTitle>
          <DialogDescription>
            Análise detalhada da validação para cada coluna selecionada.
          </DialogDescription>
        </DialogHeader>
        {reports.length > 0 ? (
          <Tabs defaultValue={defaultTab} className="flex flex-col flex-1 overflow-hidden mt-2">
            <ScrollArea className="w-full flex-shrink-0">
                <TabsList>
                {reports.map(report => (
                    <TabsTrigger key={report.key} value={report.key}>
                    {report.columnName} (vs {report.sourceColumnName})
                    {report.summary.invalidRows > 0 && (
                        <Badge variant="destructive" className="ml-2">
                        {report.summary.invalidRows}
                        </Badge>
                    )}
                    </TabsTrigger>
                ))}
                </TabsList>
                <ScrollBar orientation="horizontal"/>
            </ScrollArea>
            
            {reports.map(report => (
              <TabsContent key={report.key} value={report.key} className="flex-1 overflow-y-auto mt-4 pr-1">
                 <div className="pr-4">
                    <div className="flex justify-between items-start mb-4 p-4 border rounded-lg bg-secondary/50">
                        <div className="text-sm space-y-1">
                          <p><strong>Planilha:</strong> {report.worksheetName}</p>
                          <p><strong>Total de Linhas (no filtro):</strong> {report.summary.totalRows}</p>
                          <p className="font-semibold text-green-700"><strong>Correspondências Válidas:</strong> {report.summary.validRows}</p>
                          <p className="font-semibold text-red-700"><strong>Divergências:</strong> {report.summary.invalidRows}</p>
                          {report.summary.duplicateKeys > 0 && (
                            <p className="font-semibold text-orange-600"><strong>Alunos Duplicados:</strong> {report.summary.duplicateKeys}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(report.worksheetName)}
                          disabled={isDownloading}
                        >
                           {isDownloading && downloadingKey === report.worksheetName ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                          Baixar Planilha Corrigida
                        </Button>
                    </div>
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList>
                            <TabsTrigger value="details">Resultados Detalhados</TabsTrigger>
                            {report.duplicateKeyList && report.duplicateKeyList.length > 0 && (
                                <TabsTrigger value="duplicates">Alunos Duplicados</TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="details">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Linha</TableHead>
                                    {report.sourceKeyColumnName && <TableHead>{report.keyColumnName}</TableHead>}
                                    <TableHead>Valor ({report.sourceColumnName})</TableHead>
                                    <TableHead>Valor ({report.columnName})</TableHead>
                                    <TableHead className="w-[150px] text-center">Status</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {report.results.map(row => (
                                    <TableRow key={row.rowIndex}>
                                    <TableCell>{row.rowIndex + 1}</TableCell>
                                    {report.sourceKeyColumnName && <TableCell className="font-medium">{row.keyValue}</TableCell>}
                                    <TableCell className="font-mono text-xs">{row.sourceValue !== undefined ? formatValue(row.sourceValue, report.sourceValueDataType) : <span className="text-muted-foreground italic">Não encontrado</span>}</TableCell>
                                    <TableCell className="font-mono text-xs">{formatValue(row.value, report.valueDataType) || <span className="text-muted-foreground italic">Vazio</span>}</TableCell>
                                    <TableCell className="text-center">
                                        {row.isValid ? (
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                            Correspondente
                                        </Badge>
                                        ) : (
                                        <Badge variant="destructive">
                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                            Divergente
                                        </Badge>
                                        )}
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        {report.duplicateKeyList && report.duplicateKeyList.length > 0 && (
                          <TabsContent value="duplicates">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome do Aluno Duplicado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.duplicateKeyList.map((name, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                          </TabsContent>
                        )}
                    </Tabs>
                 </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum relatório de validação para exibir (verifique os filtros aplicados).</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
