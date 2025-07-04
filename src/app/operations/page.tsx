'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SelectionWithValidation, DetailedReport, SpreadsheetData, Selection } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/icons';
import { ArrowLeft, Search, LoaderCircle, ClipboardCheck, CheckCircle2, XCircle, FilePenLine, FileSpreadsheet, ListChecks, Upload, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DataTypeIcon } from '@/components/data-type-icon';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { getDetailedValidationReportAction, compareAndCorrectAction, generatePaymentSheetAction, updatePaymentSheetAction, type ValidationRequest, type ReportOptions } from '@/app/actions';
import { ValidationResultsDialog } from '@/components/sheetsifter/validation-results-dialog';
import { OperationOptionsDialog } from '@/components/sheetsifter/operation-options-dialog';

const operations = [
  {
    id: 'vlookup',
    title: 'PROCV (VLOOKUP)',
    description: 'Encontre e exiba dados relacionados de várias colunas. Esta operação é executada em segundo plano.',
    icon: Search,
  },
  {
    id: 'compare-report-only',
    title: 'Comparar Valores (Apenas Relatório)',
    description: 'Use colunas "Chave" para encontrar correspondências e compare os dados em colunas "Valor". Exibe um relatório detalhado.',
    icon: ClipboardCheck,
  },
  {
    id: 'compare-and-correct',
    title: 'Comparar e Corrigir (Baixar Arquivo)',
    description: 'Use uma planilha principal como fonte da verdade. Corrija os valores em outras planilhas e baixe os arquivos corrigidos.',
    icon: FilePenLine,
  },
  {
    id: 'generate-payment-sheet',
    title: 'Gerar planilha de pagamento',
    description: 'Gera uma nova planilha (Nome, CPF, Valor) com base nos valores da planilha principal.',
    icon: FileSpreadsheet,
  },
  {
    id: 'update-payment-sheet',
    title: 'Verificar e Atualizar Planilha de Pagamento',
    description: 'Envie uma planilha de pagamento existente para adicionar novas pessoas da planilha principal.',
    icon: ListChecks,
  },
];

type PrimaryWorksheet = { fileName: string, worksheetName: string };

export default function OperationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selections, setSelections] = useState<Map<string, SelectionWithValidation>>(new Map());
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData[]>([]);
  const [primaryWorksheet, setPrimaryWorksheet] = useState<PrimaryWorksheet | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [isExecuting, startExecuting] = useTransition();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isOptionsModalOpen, setOptionsModalOpen] = useState(false);
  const [detailedReports, setDetailedReports] = useState<DetailedReport[] | null>(null);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({});
  const [existingPaymentFile, setExistingPaymentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    try {
      const storedSelections = sessionStorage.getItem('selections');
      const storedSpreadsheetData = sessionStorage.getItem('spreadsheetData');
      const storedPrimaryWorksheet = sessionStorage.getItem('primaryWorksheet');

      if (storedSelections) {
        const parsedSelections: [string, SelectionWithValidation][] = JSON.parse(storedSelections);
        setSelections(new Map(parsedSelections));
      } else {
        router.push('/');
      }

      if (storedSpreadsheetData) {
        setSpreadsheetData(JSON.parse(storedSpreadsheetData));
      }
      if (storedPrimaryWorksheet) {
        setPrimaryWorksheet(JSON.parse(storedPrimaryWorksheet));
      }

    } catch (error) {
      console.error("Failed to parse data from sessionStorage", error);
      router.push('/');
    }
  }, [router]);

  const handleStartOver = () => {
    sessionStorage.clear();
    router.push('/');
  };

  const executeCompareReportOnly = (options: ReportOptions) => {
    if (!primaryWorksheet) {
      toast({ variant: 'destructive', title: 'Nenhuma Planilha Principal', description: 'Volte e marque uma planilha como principal.' });
      return;
    }
    setReportOptions(options); // Set options to be passed to the dialog
    startExecuting(async () => {
      const requests: ValidationRequest[] = Array.from(selections.entries()).map(
        ([key, selection]) => ({ key, selection })
      );

      if (requests.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma coluna para verificar.' });
        return;
      }
      
      try {
        const reports = await getDetailedValidationReportAction(requests, primaryWorksheet, options);
        setDetailedReports(reports);
        
        const newSelections = new Map(selections);
        if (reports.length > 0) {
            reports.forEach(report => {
                const selection = newSelections.get(report.key);
                if (selection) {
                    const isValid = report.summary.invalidRows === 0;
                    const reason = isValid 
                    ? `Todos os valores correspondentes são idênticos para '${report.columnName}'.`
                    : `${report.summary.invalidRows} de ${report.summary.totalRows} valores são divergentes.`;

                    selection.validationResult = { isValid, reason };
                    newSelections.set(report.key, selection);
                }
            });
        }
        setSelections(newSelections);
        sessionStorage.setItem('selections', JSON.stringify(Array.from(newSelections.entries())));

        setModalOpen(true);

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao verificar os valores.';
          toast({
            variant: 'destructive',
            title: 'Erro na Verificação',
            description: errorMessage,
          });
      }
    });
  };
  
  const executeCompareAndCorrect = (options: ReportOptions) => {
    if (spreadsheetData.length === 0 || !primaryWorksheet) {
        toast({
            variant: 'destructive',
            title: 'Configuração Incompleta',
            description: 'Dados da planilha ou planilha principal não encontrados. Por favor, comece de novo.',
        });
        return;
    }

    startExecuting(async () => {
        try {
            const correctedFiles = await compareAndCorrectAction(
                spreadsheetData, 
                Array.from(selections.values()), 
                primaryWorksheet,
                undefined,
                options
            );
            
            if (correctedFiles.length > 0) {
                correctedFiles.forEach(file => {
                    const link = document.createElement('a');
                    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${file.content}`;
                    link.download = file.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
                toast({ title: "Correção Completa", description: `${correctedFiles.length} planilha(s) foram corrigidas e baixadas.` });
            } else {
                toast({ title: "Nenhuma Correção Necessária", description: "Todos os valores correspondentes já estavam corretos ou nenhuma linha atendeu aos critérios de filtro." });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro durante a correção.';
            toast({
                variant: 'destructive',
                title: 'Erro na Correção',
                description: errorMessage,
            });
        }
    });
  };

  const executeGeneratePaymentSheet = () => {
    if (!primaryWorksheet) {
      toast({ variant: 'destructive', title: 'Nenhuma Planilha Principal', description: 'Por favor, marque uma planilha como principal (usando a estrela).' });
      return;
    }
    
    const allSelections = Array.from(selections.values());
    const primarySelections = allSelections.filter(s => s.fileName === primaryWorksheet.fileName && s.worksheetName === primaryWorksheet.worksheetName);

    const hasNome = primarySelections.some(s => s.role === 'key');
    const hasCPF = primarySelections.some(s => s.role === 'cpf');
    const hasValor = primarySelections.some(s => s.role === 'value');

    if (!hasNome || !hasCPF || !hasValor) {
        toast({
            variant: 'destructive',
            title: 'Seleção Incompleta',
            description: 'Para gerar a planilha de pagamento, selecione colunas para "Nome (Chave)", "CPF" e "Valor" na planilha principal.',
        });
        return;
    }

    startExecuting(async () => {
        try {
            const paymentFile = await generatePaymentSheetAction(
                Array.from(selections.values()), 
                primaryWorksheet,
            );
            
            if (paymentFile) {
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${paymentFile.content}`;
                link.download = paymentFile.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Planilha Gerada", description: `A planilha "${paymentFile.fileName}" foi baixada.` });
            } else {
                toast({ title: "Nenhum Pagamento a Gerar", description: "Nenhuma linha na planilha principal tinha um valor maior que zero." });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro durante a geração da planilha.';
            toast({
                variant: 'destructive',
                title: 'Erro na Geração',
                description: errorMessage,
            });
        }
    });
  };

  const executeUpdatePaymentSheet = () => {
    if (!primaryWorksheet) {
        toast({ variant: 'destructive', title: 'Nenhuma Planilha Principal', description: 'Por favor, marque uma planilha como principal.' });
        return;
    }
    if (!existingPaymentFile) {
        toast({ variant: 'destructive', title: 'Nenhum Arquivo Enviado', description: 'Por favor, envie a planilha de pagamento existente.' });
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(existingPaymentFile);
    reader.onload = () => {
        startExecuting(async () => {
            try {
                const base64Content = (reader.result as string).split(',')[1];
                const updatedFile = await updatePaymentSheetAction(
                    Array.from(selections.values()),
                    primaryWorksheet,
                    base64Content,
                    existingPaymentFile.name
                );

                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${updatedFile.content}`;
                link.download = updatedFile.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Planilha Atualizada", description: `A planilha "${updatedFile.fileName}" foi baixada com as novas entradas.` });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro durante a atualização.';
                toast({
                    variant: 'destructive',
                    title: 'Erro na Atualização',
                    description: errorMessage,
                });
            } finally {
                setExistingPaymentFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
            }
        });
    };
    reader.onerror = (error) => {
        toast({ variant: 'destructive', title: 'Erro ao Ler Arquivo', description: 'Não foi possível ler o arquivo selecionado.' });
    };
  };


  const executeOperationWithOptions = (options: ReportOptions) => {
    if (!selectedOperation) return;

    if (selectedOperation === 'compare-report-only') {
      executeCompareReportOnly(options);
    } else if (selectedOperation === 'compare-and-correct') {
      executeCompareAndCorrect(options);
    }
  };


  const handleExecuteOperation = () => {
    if (!selectedOperation) return;

    if (selectedOperation === 'vlookup') {
      toast({
        title: "Não Implementado",
        description: "A operação PROCV ainda não foi implementada.",
      });
      return;
    }

    if (selectedOperation === 'generate-payment-sheet') {
      executeGeneratePaymentSheet();
      return;
    }

    if (selectedOperation === 'update-payment-sheet') {
      executeUpdatePaymentSheet();
      return;
    }

    const allSelections = Array.from(selections.values());
    const keys = allSelections.filter(s => s.role === 'key');
    const values = allSelections.filter(s => s.role === 'value');

    if (keys.length < 1 || values.length < 1) {
        toast({
            variant: 'destructive',
            title: 'Seleção Incompleta',
            description: 'Para comparar, selecione pelo menos uma coluna "Chave" e uma "Valor".',
        });
        return;
    }
    
    if (selectedOperation === 'compare-report-only') {
      if (keys.length < 2 || values.length < 2) {
          toast({
              variant: 'destructive',
              title: 'Seleção Incompleta',
              description: 'Para comparar valores, selecione pelo menos duas colunas "Chave" e duas colunas "Valor" entre os arquivos/planilhas.',
          });
          return;
      }
    }
    
    if (selectedOperation === 'compare-and-correct') {
      if (!primaryWorksheet) {
        toast({ variant: 'destructive', title: 'Nenhuma Planilha Principal', description: 'Por favor, volte e marque uma planilha como principal (usando a estrela) para usar como fonte da verdade.' });
        return;
      }
    }

    setOptionsModalOpen(true);
  };

  const selectedArray = Array.from(selections.values());

  if (selectedArray.length === 0) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <AppLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-slate-800">SheetSifter</h1>
          </div>
          <Button variant="outline" onClick={handleStartOver}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Voltar e Selecionar Novamente
          </Button>
        </header>
        <main className="flex-grow p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 h-fit sticky top-8">
              <CardHeader>
                <CardTitle>Colunas Selecionadas</CardTitle>
                <CardDescription>{selectedArray.length} colunas no total.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {selectedArray.map((selection, index) => (
                      <div key={index} className="p-3 border rounded-md bg-secondary/30">
                        <div className="flex items-start justify-between">
                            <div className="flex-grow">
                                <p className="font-semibold truncate">{selection.columnName}</p>
                                <p className="text-sm text-muted-foreground truncate" title={`${selection.fileName} > ${selection.worksheetName}`}>
                                    <FileText className="h-3 w-3 inline-block mr-1" />
                                    {selection.fileName} > {selection.worksheetName}
                                </p>
                            </div>
                            {selection.validationResult && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        {selection.validationResult.isValid ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 ml-2 shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 ml-2 shrink-0" />
                                        )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{selection.validationResult.reason}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <DataTypeIcon type={selection.dataType} className="h-4 w-4" />
                            <Badge variant="outline" className="capitalize">{selection.dataType}</Badge>
                          </div>
                          {selection.role && (
                             <Badge variant={selection.role === 'key' ? 'default' : 'secondary'} className="capitalize">{selection.role}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">O que você gostaria de fazer?</CardTitle>
                <CardDescription>
                  Escolha uma das operações abaixo para aplicar às suas colunas selecionadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-500px)] pr-4">
                  <div className="space-y-4">
                    {operations.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setSelectedOperation(op.id)}
                        className={cn(
                          "w-full p-4 border rounded-lg text-left flex items-start gap-4 transition-all",
                          "hover:bg-accent hover:text-accent-foreground",
                          selectedOperation === op.id ? "bg-accent text-accent-foreground ring-2 ring-primary" : "bg-transparent"
                        )}
                      >
                        <op.icon className="h-8 w-8 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="text-lg font-semibold">{op.title}</h3>
                          <p className="text-muted-foreground">{op.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                
                {selectedOperation === 'update-payment-sheet' && (
                  <div className="mt-6 p-4 border-dashed border-2 rounded-lg text-center bg-secondary/30">
                      <h4 className="font-semibold mb-2">Enviar Planilha Existente</h4>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              setExistingPaymentFile(file);
                              toast({ title: 'Arquivo Selecionado', description: file.name });
                          }
                      }}
                        className="hidden"
                        accept=".xlsx,.xls,.ods,.csv"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {existingPaymentFile ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
                      </Button>
                      {existingPaymentFile && <p className="text-sm mt-2 text-muted-foreground">Arquivo: {existingPaymentFile.name}</p>}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button size="lg" onClick={handleExecuteOperation} disabled={!selectedOperation || isExecuting}>
                    {isExecuting ? <LoaderCircle className="animate-spin mr-2" /> : null}
                    Executar Operação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <ValidationResultsDialog 
            isOpen={isModalOpen} 
            onOpenChange={setModalOpen} 
            reports={detailedReports} 
            spreadsheetData={spreadsheetData}
            selections={selectedArray}
            primaryWorksheet={primaryWorksheet}
            reportOptions={reportOptions}
        />
         <OperationOptionsDialog
            isOpen={isOptionsModalOpen}
            onOpenChange={setOptionsModalOpen}
            onExecute={executeOperationWithOptions}
            operationId={selectedOperation}
        />
      </div>
    </TooltipProvider>
  );
}
