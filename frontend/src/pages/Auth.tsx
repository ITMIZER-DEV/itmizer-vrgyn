import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { Lock, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    const { error } = await signInWithGoogle(credentialResponse.credential);

    if (error) {
      const msg = typeof error === 'string' ? error : (error as any).message || 'Erro desconhecido';
      
      if (msg.includes('permissão') || msg.includes('encontrada')) {
        setErrorMessage(msg);
        setShowPermissionDialog(true);
      } else {
        toast({
          title: 'Acesso Negado',
          description: msg,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso via Google.',
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const loginSSO = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      const { error } = await signInWithGoogle(tokenResponse.access_token);
      
      if (error) {
        toast({
          title: 'Erro no SSO',
          description: typeof error === 'string' ? error : (error as any).message || 'Erro ao validar domínio ou token.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso via SSO/Google.',
        });
        navigate('/');
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('SSO Login Failed:', error);
      toast({
        title: 'Erro',
        description: 'Falha na autenticação SSO.',
        variant: 'destructive',
      });
    }
  });

  const handleSSOClick = () => {
    loginSSO();
  };

  return (
    <main className="flex flex-col md:flex-row full-height w-full overflow-hidden bg-white">
      {/* Left Hero Section */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img
          alt="Ambiente de Escritório Profissional"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpc20vDS_XvXvaSFfvGawF1qIpgHr7-TkyUQzQp-StZrOkId0cyJcXoqe3VSjGLJketdkHgAAITELIZwO0G52-kfSdDRtvi3mJExnIvCGdg2QO8FfUodvoQye06QGQpWbDnYo7lQAU7aO1skmBXnNzu1Qseex9iUElZlAbNmQoVHfwPrXsRAB7J6fzpkRovMBqGPEJQTXdKWo5nTwrjoSCiNofEHni60VZ58mAP9-2kI01OkVN-NV8VciPDB1BNrorAzwdlJwQzKfb"
        />
        {/* Orange Overlay */}
        <div className="absolute inset-0 hero-overlay flex flex-col justify-center px-12 lg:px-24 text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Excelência em Gestão de Projetos
          </h1>
          <p className="text-xl opacity-90 max-w-md">
            Simplificando avaliações, implantações e migrações para o seu negócio.
          </p>
        </div>
      </section>

      {/* Right Login Section */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-12">
          {/* Logo Header */}
          <header className="text-center md:text-left">



          </header>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Google Sign In Container */}
            <div className="mt-4 flex justify-center md:justify-start">
              <img src="/logo-vr.svg" alt="VR Software Logo" className="h-12 w-auto" />
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast({
                    title: 'Erro',
                    description: 'Falha na autenticação com o Google.',
                    variant: 'destructive',
                  });
                }}
                // useOneTap
                theme="outline"
                size="large"
                width="350"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm uppercase tracking-wider">ou</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Company Login (SSO) */}
            <button
              onClick={handleSSOClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-brand-dark hover:bg-black text-white rounded-lg transition-colors duration-200 font-medium shadow-lg disabled:opacity-50"
            >
              <Lock className="w-5 h-5" />
              Login (SSO)
            </button>
          </div>

          {/* Footer Links */}
          <footer className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between text-sm text-gray-400 gap-4">
            <p>© 2024 ITmizer. Todos os direitos reservados.</p>
            <div className="flex space-x-6">
              <Link className="hover:text-brand-orange transition-colors" to="/privacity">Política de Privacidade</Link>
              <Link className="hover:text-brand-orange transition-colors" to="/termservicy">Termos de Serviço</Link>
              <a className="hover:text-brand-orange transition-colors" href="#">Suporte</a>
            </div>
          </footer>
        </div>
      </section>

      {/* Permission Denied Modal */}
      <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <AlertDialogTitle>Acesso Restrito</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 text-base">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-brand-dark hover:bg-black">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
