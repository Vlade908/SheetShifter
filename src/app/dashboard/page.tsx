
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Users, Upload, CheckSquare, Settings, Download } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import withAuth from "@/components/with-auth";

function DashboardPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground">Dashboard</h1>
          </div>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-y-auto">
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
              Esta é a sua central de controle para análise de planilhas. Siga os passos abaixo para começar.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Envie suas Planilhas</h4>
                    <p className="text-muted-foreground text-sm">Vá para a seção "Subsidio" ou "Passe" no menu lateral e envie uma ou mais planilhas. O sistema as processará automaticamente.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Selecione e Configure as Colunas</h4>
                    <p className="text-muted-foreground text-sm">Marque as caixas de seleção das colunas que deseja analisar. Se necessário, defina um papel para elas (Chave, Valor, CPF). Você também pode ajustar o tipo de dado detectado.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Valide e Prossiga</h4>
                    <p className="text-muted-foreground text-sm">Clique em "Validar e Prosseguir". O sistema verificará a compatibilidade dos dados e o levará para a tela de operações.</p>
                  </div>
                </li>
                 <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Escolha uma Operação</h4>
                    <p className="text-muted-foreground text-sm">Na tela de operações, escolha o que você quer fazer: gerar um relatório de comparação, corrigir planilhas com base em uma principal, ou gerar uma planilha de pagamento.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">5</div>
                  <div>
                    <h4 className="font-semibold">Execute e Baixe</h4>
                    <p className="text-muted-foreground text-sm">Defina qualquer filtro necessário, clique em "Executar Operação" e, em seguida, visualize os resultados ou baixe seus arquivos corrigidos/gerados.</p>
                  </div>
                </li>
              </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
