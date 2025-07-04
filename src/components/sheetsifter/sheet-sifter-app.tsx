"use client";

import { useState, useTransition } from "react";
import type { DataType, SelectionWithValidation, SpreadsheetData, Worksheet, Column } from "@/types";
import { validateSelectionsAction, type ValidationRequest } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppLogo } from "@/components/icons";
import { DataTypeIcon } from "@/components/data-type-icon";
import { UploadCloud, Sheet, LoaderCircle, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

// Mock Data
const mockSpreadsheetData: SpreadsheetData = {
  fileName: "Q3_Financials.xlsx",
  worksheets: [
    {
      name: "Sales-Data",
      columns: [
        { name: "OrderID", sampleData: ["78921", "78922", "78923"] },
        { name: "Product", sampleData: ["Widget A", "Widget B", "Widget C"] },
        { name: "SaleDate", sampleData: ["2023-07-15", "2023-07-16", "2023-07-17"] },
        { name: "Amount", sampleData: ["$1,200.50", "$750.00", "$2,500.75"] },
        { name: "Quantity", sampleData: ["10", "5", "15"] },
      ],
    },
    {
      name: "Employee-Hours",
      columns: [
        { name: "EmployeeID", sampleData: ["E101", "E102", "E103"] },
        { name: "WeekEnding", sampleData: ["07/21/2023", "07/21/2023", "07/21/2023"] },
        { name: "HoursWorked", sampleData: ["40", "38.5", "42"] },
        { name: "Notes", sampleData: ["Overtime approved", "", "Client meeting"] },
      ],
    },
    {
        name: "Inventory-Levels",
        columns: [
          { name: "SKU", sampleData: ["WID-A-01", "WID-B-01", "WID-C-01"] },
          { name: "Stock", sampleData: ["150", "200", "75"] },
          { name: "LastRestock", sampleData: ["July 5, 2023", "2023/07/10", "7/12/23"] },
          { name: "Value", sampleData: ["15000", "10000.00", "18750.00"] },
        ],
      },
  ],
};

const dataTypes: DataType[] = ['text', 'number', 'date', 'currency'];

export default function SheetSifterApp() {
  const [step, setStep] = useState<"upload" | "selection">("upload");
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null);
  const [selections, setSelections] = useState<Map<string, SelectionWithValidation>>(new Map());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileUpload = () => {
    setSpreadsheetData(mockSpreadsheetData);
    setStep("selection");
  };

  const handleStartOver = () => {
    setStep("upload");
    setSpreadsheetData(null);
    setSelections(new Map());
  };

  const handleToggleSelection = (worksheetName: string, column: Column, isSelected: boolean) => {
    const key = `${worksheetName}-${column.name}`;
    const newSelections = new Map(selections);
    if (isSelected) {
      newSelections.set(key, {
        worksheetName,
        columnName: column.name,
        sampleData: column.sampleData,
        dataType: 'text',
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

  const handleValidate = () => {
    if (selections.size === 0) {
      toast({
        variant: "destructive",
        title: "No columns selected",
        description: "Please select at least one column to validate.",
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
            title: "Validation Complete",
            description: "AI analysis of column data types is finished.",
          });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: "An unexpected error occurred during AI validation.",
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
                Start Over
            </Button>
        )}
    </header>
  );

  if (step === "upload") {
    return (
      <div className="flex flex-col min-h-screen">
          {renderHeader()}
          <div className="flex-grow flex items-center justify-center p-4">
              <Card className="w-full max-w-lg text-center shadow-lg">
                  <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                          <UploadCloud className="h-12 w-12 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-3xl">Upload Your Spreadsheet</CardTitle>
                      <CardDescription className="text-base">Upload an .xls or .ods file to begin selecting and validating your data.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button size="lg" onClick={handleFileUpload}>
                          Select File to Upload
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">(For this demo, a sample file will be used)</p>
                  </CardContent>
              </Card>
          </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        {renderHeader()}
        <div className="flex-grow p-4 md:p-8">
          <Card className="w-full mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Select Worksheets & Columns</CardTitle>
              <CardDescription>
                Choose the columns you want to validate from your file: <span className="font-medium text-primary">{spreadsheetData?.fileName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {spreadsheetData?.worksheets.map((worksheet) => (
                  <AccordionItem value={worksheet.name} key={worksheet.name}>
                    <AccordionTrigger className="hover:bg-secondary/50 px-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <Sheet className="h-5 w-5 text-accent"/>
                            <span className="font-medium">{worksheet.name}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Column</TableHead>
                                        <TableHead>Data Type</TableHead>
                                        <TableHead className="text-right">Validation Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {worksheet.columns.map((column) => {
                                        const key = `${worksheet.name}-${column.name}`;
                                        const selection = selections.get(key);
                                        return (
                                            <TableRow key={key} className={selection ? 'bg-primary/5' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={!!selection}
                                                        onCheckedChange={(checked) => handleToggleSelection(worksheet.name, column, !!checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{column.name}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={selection?.dataType}
                                                        onValueChange={(value) => handleDataTypeChange(key, value as DataType)}
                                                        disabled={!selection}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {dataTypes.map((type) => (
                                                                <SelectItem key={type} value={type}>
                                                                    <div className="flex items-center gap-2">
                                                                        <DataTypeIcon type={type} className="h-4 w-4 text-muted-foreground"/>
                                                                        <span className="capitalize">{type}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {selection?.isValidating ? (
                                                        <LoaderCircle className="h-5 w-5 animate-spin text-primary inline-block" />
                                                    ) : selection?.validationResult ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                {selection.validationResult.isValid ? (
                                                                    <CheckCircle2 className="h-5 w-5 text-green-600 inline-block" />
                                                                ) : (
                                                                    <XCircle className="h-5 w-5 text-red-600 inline-block" />
                                                                )}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-xs">{selection.validationResult.reason}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="flex justify-end mt-6">
                <Button size="lg" onClick={handleValidate} disabled={isPending}>
                  {isPending ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Validate {selections.size > 0 ? `${selections.size} Column(s)` : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
