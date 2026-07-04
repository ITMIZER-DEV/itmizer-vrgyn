import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Privacy() {
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

      <h1 className="text-4xl font-bold mb-8 text-brand-orange">Política de Privacidade</h1>
      <h2 className="text-2xl font-bold mb-8 text-brand-orange">ITmizer VR</h2>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">1. Introdução</h2>
          <p>
            Esta Política de Privacidade descreve como a <strong>ITmizer</strong> coleta, utiliza e protege as suas informações ao utilizar o sistema.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">2. Coleta de Dados</h2>
          <p>
            Coletamos apenas as informações necessárias para autenticação e funcionamento do sistema, incluindo:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Nome e endereço de e-mail (via Google Auth ou SSO).</li>
            <li>Identificador exclusivo do Google (Google ID).</li>
            <li>Dados de log e interações no sistema para fins de suporte e melhoria.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">3. Uso das Informações</h2>
          <p>
            Seus dados são utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Identificar seu acesso e permissões no sistema.</li>
            <li>Vincular suas atividades de projeto ao seu perfil.</li>
            <li>Garantir a segurança da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">4. Proteção de Dados</h2>
          <p>
            Empregamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração ou destruição. Utilizamos protocolos criptografados para comunicação e armazenamento seguro via Firebase e Prisma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-brand-dark">5. Seus Direitos</h2>
          <p>
            Você pode solicitar a exclusão de seus dados ou a revogação do acesso ao sistema a qualquer momento entrando em contato com o suporte técnico através do e-mail: ti@itmizer.com.br.
          </p>
        </section>

        <footer className="pt-12 text-sm text-gray-500">
          Última atualização: 14 de Março de 2026
        </footer>
      </div>
    </div >
  );
}
