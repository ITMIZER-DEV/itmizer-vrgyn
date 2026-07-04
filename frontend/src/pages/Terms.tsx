import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-8 md:p-24 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate('/auth')}
        className="mb-8 gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para o Login
      </Button>

      <h1 className="text-4xl font-bold mb-8 text-brand-orange">Termos de Serviço</h1>
      <h2 className="text-2xl font-bold mb-8 text-brand-orange">ITmizer VR</h2>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar o ITmizer VR, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">2. Licença de Uso</h2>
          <p>
            É concedida permissão para acessar o sistema para fins internos de gestão de projetos, avaliações e migrações. Esta é a concessão de uma licença, não uma transferência de título.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">3. Responsabilidades</h2>
          <p>
            O usuário é responsável por manter a confidencialidade de sua conta e senha, bem como por todas as atividades que ocorrem sob sua conta. A itmizer VR não se responsabiliza por perdas causadas pelo uso indevido do sistema por parte do usuário.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">4. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo, design, código e recursos do sistema são propriedade intelectual da ITmizer Inc. e estão protegidos pelas leis de direitos autorais internacionais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">5. Modificações</h2>
          <p>
            A itmizer VR pode revisar estes termos de serviço a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
          </p>
        </section>

        <footer className="pt-12 text-sm text-gray-500">
          Última atualização: 14 de Março de 2026
        </footer>
      </div>
    </div>
  );
}
