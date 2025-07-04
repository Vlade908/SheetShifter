
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SelectionWithValidation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/icons';
import { ArrowLeft, Search, LoaderCircle, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DataTypeIcon } from '@/components/data-type-icon';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { validateSelectionsAction, type ValidationRequest } from '@/app/actions';

const operations = [
  {
    id: 'vlookup',
    title: 'PROCV (VLOOKUP)',
    description: 'Encontre e exiba dados relacionados de várias colunas. Esta operação é executada em segundo plano.',
    icon: Search,
  },
  {
    id: 'check-values',
    title: 'Verificar Valores',
    description: 'Use uma coluna como chave (ex: nome do aluno) para validar os dados em outra coluna da mesma tabela.',
    icon: ClipboardCheck,
  },
];

export default function OperationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selections, setSelections] = useState<Map<string, SelectionWithValidation>>(new Map());
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [isExecuting, startExecuting] = useTransition();

  useEffect(() => {
    try {
      const storedSelections = sessionStorage.getItem('selections');
      if (storedSelections) {
        const parsedSelections: [string, SelectionWithValidation][] = JSON.parse(storedSelections);
        setSelections(new Map(parsedSelections));
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error("Failed to parse selections from sessionStorage", error);
      router.push('/');
    }
  }, [router]);

  const handleStartOver = () => {
    sessionStorage.removeItem('selections');
    router.push('/');
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

    if (selectedOperation === 'check-values') {
      startExecuting(async () => {
        const requests: ValidationRequest[] = Array.from(selections.entries()).map(
          ([key, selection]) => ({ key, selection })
        );

        if (requests.length === 0) {
          toast({ variant: 'destructive', title: 'Nenhuma coluna para verificar.' });
          return;
        }
        
        try {
          const results = await validateSelectionsAction(requests);
          
          const newSelections = new Map(selections);
          results.forEach(result => {
            const selection = newSelections.get(result.key);
            if (selection) {
              selection.validationResult = { isValid: result.isValid, reason: result.reason };
              newSelections.set(result.key, selection);
            }
          });
          setSelections(newSelections);
          
          sessionStorage.setItem('selections', JSON.stringify(Array.from(newSelections.entries())));

          toast({
            title: "Verificação Concluída",
            description: "Os resultados da validação foram atualizados.",
          });

        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Erro na Verificação',
            description: 'Ocorreu um erro ao verificar os valores.',
          });
        }
      });
    }
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
                                <p className="text-sm text-muted-foreground truncate">
                                    Planilha: {selection.worksheetName}
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

                        <div className="flex items-center gap-2 mt-2">
                          <DataTypeIcon type={selection.dataType} className="h-4 w-4" />
                          <Badge variant="outline" className="capitalize">{selection.dataType}</Badge>
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
      </div>
    </TooltipProvider>
  );
}
