"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import type { DataType, SelectionWithValidation, SpreadsheetData, Worksheet, Column } from "@/types";
import { validateSelectionsAction, type ValidationRequest } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


import { AppLogo } from "@/components/icons";
import { DataTypeIcon } from "@/components/data-type-icon";
import { UploadCloud, Sheet, LoaderCircle, CheckCircle2, XCircle, ArrowRight, RefreshCw, Search, User, Fingerprint, CircleDollarSign, Star, FileText } from "lucide-react";

const dataTypes: DataType[] = ['text', 'number', 'date', 'currency'];

function extractColumns(data: any[][], headerRow: number): Column[] {
  if (data.length < headerRow) {
    return [];
  }
  const headerIndex = headerRow - 1;

  const headers = data[headerIndex] as string[];
  if (!headers) return [];

  const dataRows = data.slice(headerIndex + 1);

  const columns: Column[] = headers
    .map((header, index) => {
      const fullData = dataRows.map(row =>
        row[index] !== undefined && row[index] !== null ? String(row[index]) : ""
      );

      const sampleData = fullData
        .slice(0, 3)
        .filter(val => val.trim() !== ""); 

      return {
        name: String(header || `Column ${index + 1}`),
        sampleData,
        fullData,
      };
    })
    .filter(column => column.name);

  return columns;
}


export default function SheetSifterApp() {
  const [step, setStep] = useState<"upload" | "selection">("upload");
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData[]>([]);
  const [primaryWorksheet, setPrimaryWorksheet] = useState<{ fileName: string, worksheetName: string } | null>(null);
  const [selections, setSelections] = useState<Map<string, SelectionWithValidation>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);

    const filePromises = Array.from(files).map(file => {
      return new Promise<SpreadsheetData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const defaultHeaderRow = 2;

            const worksheets: Worksheet[] = workbook.SheetNames.map(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                return { 
                  name: sheetName, 
                  columns: extractColumns(jsonData, defaultHeaderRow),
                  data: jsonData,
                  headerRow: defaultHeaderRow,
                };
            });

            resolve({
              fileName: file.name,
              worksheets,
            });
          } catch (error) {
            reject(new Error(`Error processing file ${file.name}: ${error}`));
          }
        };
        reader.onerror = () => {
          reject(new Error(`Could not read file ${file.name}`));
        };
        reader.readAsArrayBuffer(file);
      });
    });

    try {
      const newSpreadsheetData = await Promise.all(filePromises);
      const allSpreadsheets = [...spreadsheetData, ...newSpreadsheetData];
      setSpreadsheetData(allSpreadsheets);
      
      if (!primaryWorksheet && allSpreadsheets.length > 0 && allSpreadsheets[0].worksheets.length > 0) {
        setPrimaryWorksheet({
          fileName: allSpreadsheets[0].fileName,
          worksheetName: allSpreadsheets[0].worksheets[0].name,
        });
      }
      setStep("selection");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
          variant: "destructive",
          title: "Erro ao Processar Arquivo",
          description: errorMessage,
      });
    } finally {
      setIsProcessingFile(false);
      if(event.target) {
        event.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartOver = () => {
    setStep("upload");
    setSpreadsheetData([]);
    setSelections(new Map());
    setPrimaryWorksheet(null);
    sessionStorage.clear();
  };

  const handleHeaderRowChange = (fileName: string, worksheetName: string, newHeaderRow: number) => {
    if (isNaN(newHeaderRow) || newHeaderRow < 1) return;

    setSpreadsheetData(prevData => {
      return prevData.map(file => {
        if (file.fileName === fileName) {
          const newWorksheets = file.worksheets.map(ws => {
            if (ws.name === worksheetName) {
              const newColumns = extractColumns(ws.data, newHeaderRow);
              return { ...ws, headerRow: newHeaderRow, columns: newColumns };
            }
            return ws;
          });
          return { ...file, worksheets: newWorksheets };
        }
        return file;
      });
    });

    setSelections(prevSelections => {
      const newSelections = new Map(prevSelections);
      prevSelections.forEach((_, key) => {
        if (key.startsWith(`${fileName}-${worksheetName}-`)) {
          newSelections.delete(key);
        }
      });
      return newSelections;
    });
  };

  const handleToggleSelection = (fileName: string, worksheetName: string, column: Column, columnIndex: number, isSelected: boolean) => {
    const key = `${fileName}-${worksheetName}-${columnIndex}`;
    const newSelections = new Map(selections);
    if (isSelected) {
      newSelections.set(key, {
        fileName,
        worksheetName,
        columnName: column.name,
        sampleData: column.sampleData || [],
        fullData: column.fullData || [],
        dataType: 'text',
        role: undefined,
        isValidating: false,
      });
    } else {
      newSelections.delete(key);
    }
    setSelections(newSelections);
  };
  
  const handleDataTypeChange = (key: string, dataType: DataType) => {
    const newSelections = new Map(selections);
    const selection = newSelections.get(key);
    if (selection) {
      selection.dataType = dataType;
      newSelections.set(key, selection);
      setSelections(newSelections);
    }
  };

  const handleRoleChange = (key: string, role: 'key' | 'value' | 'cpf') => {
    const newSelections = new Map(selections);
    const selection = newSelections.get(key);
    if (selection) {
      selection.role = role;
      newSelections.set(key, selection);
      setSelections(newSelections);
    }
  };

  const handleValidateAndProceed = () => {
    if (selections.size === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma coluna selecionada",
        description: "Selecione pelo menos uma coluna para validar.",
      });
      return;
    }
    
    const hasRoles = Array.from(selections.values()).some(s => s.role);
    if(hasRoles && !primaryWorksheet) {
      toast({
        variant: "destructive",
        title: "Nenhuma Planilha Principal",
        description: "Se você definiu papéis (Chave/Valor), por favor, marque uma planilha como principal (usando a estrela) para usar como fonte da verdade.",
      });
      return;
    }


    startTransition(async () => {
      const selectionsToValidate = new Map(selections);
      selectionsToValidate.forEach(s => s.isValidating = true);
      setSelections(selectionsToValidate);

      const requests: ValidationRequest[] = Array.from(selectionsToValidate.entries()).map(([key, selection]) => ({
        key,
        selection,
      }));

      try {
        const results = await validateSelectionsAction(requests);
        const validatedSelections = new Map(selectionsToValidate);
        results.forEach(result => {
          const selection = validatedSelections.get(result.key);
          if (selection) {
            selection.isValidating = false;
            selection.validationResult = { isValid: result.isValid, reason: result.reason };
            validatedSelections.set(result.key, selection);
          }
        });
        setSelections(validatedSelections);
        toast({
            title: "Validação de tipo completa",
            description: "Redirecionando para a página de operações...",
        });
        
        const selectionsToStore = Array.from(validatedSelections.entries());
        sessionStorage.setItem('selections', JSON.stringify(selectionsToStore));
        sessionStorage.setItem('spreadsheetData', JSON.stringify(spreadsheetData));
        if(primaryWorksheet) {
          sessionStorage.setItem('primaryWorksheet', JSON.stringify(primaryWorksheet));
        }
        router.push('/operations');

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Falha na Validação",
          description: "Ocorreu um erro inesperado durante a validação.",
        });
        const errorSelections = new Map(selectionsToValidate);
        errorSelections.forEach(s => s.isValidating = false);
        setSelections(errorSelections);
      }
    });
  };

  const renderHeader = () => (
    <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <AppLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-slate-800">SheetSifter</h1>
        </div>
        {step === 'selection' && (
            <Button variant="outline" onClick={handleStartOver}>
                <RefreshCw className="mr-2 h-4 w-4"/>
                Começar de Novo
            </Button>
        )}
    </header>
  );

  if (step === "upload") {
    return (
      <div className="flex flex-col min-h-screen">
          {renderHeader()}
          <main className="flex-grow flex items-center justify-center p-4">
              <Card className="w-full max-w-lg text-center shadow-lg">
                  <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                          <UploadCloud className="h-12 w-12 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-3xl">Envie suas Planilhas</CardTitle>
                      <CardDescription className="text-base">Envie um ou mais arquivos .xls, .xlsx, .ods ou .csv para começar a comparar, selecionar e validar seus dados.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".xlsx,.xls,.ods,.csv"
                          disabled={isProcessingFile}
                          multiple
                      />
                      <Button size="lg" onClick={handleUploadClick} disabled={isProcessingFile}>
                          {isProcessingFile ? (
                            <>
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            "Selecionar Arquivos para Enviar"
                          )}
                      </Button>
                  </CardContent>
              </Card>
          </main>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        {renderHeader()}
        <main className="flex-grow p-4 md:p-8">
          <Card className="w-full mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Selecione as Colunas e Valide</CardTitle>
              <CardDescription>
                Selecione um arquivo, escolha a aba, defina a linha do cabeçalho e selecione as colunas para validar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={spreadsheetData.map(f => f.fileName)} className="w-full">
                {spreadsheetData.map((file) => (
                  <AccordionItem value={file.fileName} key={file.fileName}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{file.fileName}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4 border-l-2 ml-2">
                      <Tabs defaultValue={file.worksheets[0]?.name} className="w-full">
                        <ScrollArea className="w-full">
                          <TabsList>
                            {file.worksheets.map((worksheet) => {
                              const isPrimary = primaryWorksheet?.fileName === file.fileName && primaryWorksheet?.worksheetName === worksheet.name;
                              const hasSelections = Array.from(selections.keys()).some(k => k.startsWith(`${file.fileName}-${worksheet.name}-`));
                              return (
                                <TabsTrigger value={worksheet.name} key={worksheet.name} className="relative pr-10">
                                  <Sheet className="mr-2 h-4 w-4" />
                                  {worksheet.name}
                                  {hasSelections && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPrimaryWorksheet({ fileName: file.fileName, worksheetName: worksheet.name });
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
                                      >
                                        <Star className={cn("h-4 w-4 text-gray-400", isPrimary && "fill-yellow-400 text-yellow-500")} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Marcar como planilha principal</p></TooltipContent>
                                  </Tooltip>
                                </TabsTrigger>
                              )
                            })}
                          </TabsList>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        {file.worksheets.map((worksheet) => (
                          <TabsContent value={worksheet.name} key={worksheet.name} className="mt-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 my-4">
                              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg w-full md:w-auto flex-grow">
                                <Label htmlFor={`header-row-${file.fileName}-${worksheet.name}`} className="text-sm font-medium shrink-0">
                                  Linha do Cabeçalho
                                </Label>
                                <Input
                                  id={`header-row-${file.fileName}-${worksheet.name}`}
                                  type="number"
                                  min="1"
                                  className="w-24 h-9"
                                  value={worksheet.headerRow}
                                  onChange={(e) => handleHeaderRowChange(file.fileName, worksheet.name, parseInt(e.target.value, 10))}
                                />
                                <p className="text-sm text-muted-foreground">Especifique qual linha contém os nomes das colunas.</p>
                              </div>
                              <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar colunas..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-10 h-9"
                                />
                              </div>
                            </div>
                            <div className="border rounded-md overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Coluna</TableHead>
                                    <TableHead>Tipo de Dado</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead className="text-right">Status da Validação</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    const allColumnsWithIndex = worksheet.columns.map((column, index) => ({ column, originalIndex: index }));
                                    const filteredColumns = allColumnsWithIndex.filter(({ column }) => column.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                    const [selectedColumns, unselectedColumns] = filteredColumns.reduce<[typeof filteredColumns, typeof filteredColumns]>(
                                      (acc, item) => {
                                        const key = `${file.fileName}-${worksheet.name}-${item.originalIndex}`;
                                        if (selections.has(key)) acc[0].push(item);
                                        else acc[1].push(item);
                                        return acc;
                                      }, [[], []]);
                                    const displayedColumns = [...selectedColumns, ...unselectedColumns];

                                    if (displayedColumns.length === 0) return <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma coluna corresponde à sua busca.</TableCell></TableRow>;
                                    
                                    return displayedColumns.map(({ column, originalIndex }, index) => {
                                      const key = `${file.fileName}-${worksheet.name}-${originalIndex}`;
                                      const selection = selections.get(key);
                                      const isFirstUnselected = index === selectedColumns.length;
                                      return (
                                        <React.Fragment key={key}>
                                          {isFirstUnselected && selectedColumns.length > 0 && unselectedColumns.length > 0 && (
                                            <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-2 px-0"><Separator /></TableCell></TableRow>
                                          )}
                                          <TableRow className={selection ? 'bg-primary/5' : ''}>
                                            <TableCell>
                                              <Checkbox checked={!!selection} onCheckedChange={(checked) => handleToggleSelection(file.fileName, worksheet.name, column, originalIndex, !!checked)} />
                                            </TableCell>
                                            <TableCell className="font-medium">{column.name}</TableCell>
                                            <TableCell>
                                              <Select value={selection?.dataType} onValueChange={(value) => handleDataTypeChange(key, value as DataType)} disabled={!selection}>
                                                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                                <SelectContent>
                                                  {dataTypes.map((type) => (
                                                    <SelectItem key={type} value={type}><div className="flex items-center gap-2"><DataTypeIcon type={type} className="h-4 w-4 text-muted-foreground"/> <span className="capitalize">{type}</span></div></SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select value={selection?.role} onValueChange={(value) => handleRoleChange(key, value as 'key' | 'value' | 'cpf')} disabled={!selection}>
                                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione o papel..." /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="key"><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><span>Nome (Chave)</span></div></SelectItem>
                                                  <SelectItem value="cpf"><div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-muted-foreground"/><span>CPF</span></div></SelectItem>
                                                  <SelectItem value="value"><div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-muted-foreground"/><span>Valor</span></div></SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {selection?.isValidating ? (<LoaderCircle className="h-5 w-5 animate-spin text-primary inline-block" />) :
                                                selection?.validationResult ? (
                                                  <Tooltip>
                                                    <TooltipTrigger>
                                                      {selection.validationResult.isValid ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 inline-block" />
                                                      ) : (
                                                        <XCircle className="h-5 w-5 text-red-600 inline-block" />
                                                      )}
                                                    </TooltipTrigger>
                                                    <TooltipContent><p className="max-w-xs">{selection.validationResult.reason}</p></TooltipContent>
                                                  </Tooltip>
                                                ) : null}
                                            </TableCell>
                                          </TableRow>
                                        </React.Fragment>
                                      );
                                    });
                                  })()}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="flex justify-end mt-6">
                <Button size="lg" onClick={handleValidateAndProceed} disabled={isPending || selections.size === 0}>
                  {isPending ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Validar e Prosseguir {selections.size > 0 ? `(${selections.size})` : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}
