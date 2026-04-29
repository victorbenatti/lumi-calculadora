🚀 Visão Geral do Projeto
A Lumi Imports é um catálogo de alta perfumaria (focado inicialmente em fragrâncias Árabes) que está em transição para se tornar um e-commerce completo. O projeto segue a filosofia Lean Startup, focando em blocos enxutos e validações constantes.

🛠️ Stack Tecnológica
Frontend: React (Vite) + TypeScript.

Estilização: Tailwind CSS + Lucide React (Ícones).

Animações: Framer Motion.

Backend/Banco: Supabase.

IA: Google Gemini SDK para enriquecimento de dados de produtos.

Roteamento: React Router DOM.

Hosting: Firebase Hosting.

📂 Estrutura de Pastas Chave
/src/pages: Páginas principais (Catálogo, Admin, Login, Detalhes).

/src/components: Componentes reutilizáveis (Inventory, SalesTracker, UI components).

/src/hooks: Lógica de negócio e estados (useERP, usePricingForm).

/src/lib: Configurações de serviços externos (Supabase, Gemini).

/src/types: Definições de tipos do TypeScript e Schema do banco.

📜 Regras de Desenvolvimento (Vibe Coding)
Tipagem Estrita: Sempre consulte e atualize o arquivo src/types/supabase.ts antes de sugerir mudanças no banco ou em componentes que consomem dados.

Densidade e Elegância: O design deve ser luxuoso e denso.

Mobile: 2 colunas no grid de produtos.

Desktop: 4 colunas no grid de produtos.

Cálculo de Preços: O preço de venda deve seguir a lógica de preco_venda_brl ou, na ausência deste, custo_final_brl * 1.30.

Componentes UI: Utilize os componentes base em /src/components/ui para manter a consistência visual.

🌳 Estratégia de Git
main: Versão estável em produção.

develop: Branch de integração para testes de novas funcionalidades.

feature/*: Branches temporárias para desenvolvimento de blocos específicos (ex: feature/carrinho).

Fluxo: Nunca codar diretamente na main. Sempre criar uma feature a partir da develop.

🗺️ Roadmap de Evolução (Lean E-commerce)
Bloco 1 (Atual): Implementação de Carrinho Global (Zustand/Context) com envio de pedido via WhatsApp formatado.

Bloco 2: Página de Checkout para coleta de dados de endereço e salvamento de pedidos no Supabase.

Bloco 3: Integração de Checkout Transparente (Asaas/Pix).

⚠️ Observações Importantes
A maioria dos produtos cadastrados são Árabes. A classificação automática via IA deve priorizar isso.

O projeto utiliza Vite 8.0 e plugins modernos de Tailwind.