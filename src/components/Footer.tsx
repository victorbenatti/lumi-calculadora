import { Instagram, Lock, Phone, ShieldCheck, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-brown/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <img
              src="/logo-lumi-importadora.svg"
              alt="Lumi Imports"
              className="h-22 w-auto opacity-90 drop-shadow-sm"
            />
            <p className="text-sm text-brand-brown/50 font-light max-w-xs">
              A sua boutique de alta perfumaria. Seleção exclusiva das melhores fragrâncias internacionais.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider">Atendimento</h4>
            <ul className="space-y-2 text-sm text-brand-brown/60 font-light">
              <li>Segunda a Sábado</li>
              <li>09:00 às 18:00</li>
              <li>Envio para todo o Brasil</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider">Contato</h4>
            <ul className="space-y-3 text-sm text-brand-brown/60 font-light">
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="w-4 h-4 text-brand-brown/40" />
                <span>(19) 98279-6873</span>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Instagram className="w-4 h-4 text-brand-brown/40" />
                <a
                  href="https://instagram.com/lumi.importadora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-brown transition-colors"
                >
                  @lumi.importadora
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider text-center md:text-left">
              Garantia Lumi
            </h4>
            <div className="flex flex-col gap-3 items-center md:items-start text-sm text-brand-brown/60 font-light">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600/70" />
                <span>Produtos 100% Originais</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-brown/50" />
                <span>Compra 100% Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-brown/50" />
                <span>Entrega Rastreada</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-brown/5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-brown/40 font-light">
            &copy; {new Date().getFullYear()} Lumi Imports Store. Todos os direitos reservados.
          </p>
          <p className="text-xs text-brand-brown/40 font-light flex items-center gap-1">
            Ambiente Seguro <Lock className="w-3 h-3" />
          </p>
        </div>
      </div>
    </footer>
  );
}
