import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios Gerados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total de relatórios criados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Correções Aplicadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total de valores corrigidos em planilhas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Arquivos Processados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total de planilhas enviadas e analisadas
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao SheetSifter!</CardTitle>
          <CardDescription>
            Esta é a sua central de controle para análise de planilhas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Use o menu lateral para navegar. Comece enviando suas planilhas na seção "Planilhas" para analisar, validar e comparar seus dados.
            </p>
        </CardContent>
      </Card>
    </main>
  );
}
