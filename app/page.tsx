'use client';

import { useState } from 'react';
import { Copy, Edit, Loader2, Send } from 'lucide-react';

export default function Home() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [atividade, setAtividade] = useState('');
  const [planoCurso, setPlanoCurso] = useState('');
  const [unidadeCurricular, setUnidadeCurricular] = useState('');
  const [estrategiaEnsino, setEstrategiaEnsino] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [notebookUrl, setNotebookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      alert('Por favor, preencha o título da aula');
      return;
    }

    if (!planoCurso.trim()) {
      alert('Por favor, preencha o plano de curso');
      return;
    }

    if (!unidadeCurricular.trim()) {
      alert('Por favor, preencha a unidade curricular');
      return;
    }

    if (!estrategiaEnsino.trim()) {
      alert('Por favor, preencha a estratégia de ensino');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          titulo, 
          descricao, 
          atividade, 
          planoCurso, 
          unidadeCurricular, 
          estrategiaEnsino 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPrompt(data.prompt);
        setNotebookUrl(data.notebookUrl);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao gerar prompt');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    alert('Prompt copiado para a área de transferência!');
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerador de Registro de Diário
          </h1>
          <p className="text-gray-600">
            Feito pelo prof Alek 👻 e os estagiários (IA's)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título da Aula *
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                placeholder="Digite o título da aula..."
                required
              />
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Breve
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                placeholder="Digite uma descrição breve da aula..."
              />
            </div>

            <div>
              <label htmlFor="atividade" className="block text-sm font-medium text-gray-700 mb-2">
                Atividade (Opcional)
              </label>
              <textarea
                id="atividade"
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                placeholder="Digite a atividade se houver..."
              />
            </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planoCurso" className="block text-sm font-medium text-gray-700 mb-2">
                    Plano de Curso *
                  </label>
                  <input
                    type="text"
                    id="planoCurso"
                    value={planoCurso}
                    onChange={(e) => setPlanoCurso(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                    placeholder="Ex: Plano de Engenharia Civil"
                    required
                  />
                </div>

              <div>
                <label htmlFor="unidadeCurricular" className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade Curricular *
                </label>
                <input
                  type="text"
                  id="unidadeCurricular"
                  value={unidadeCurricular}
                  onChange={(e) => setUnidadeCurricular(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                  placeholder="Ex: Matemática Aplicada"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="estrategiaEnsino" className="block text-sm font-medium text-gray-700 mb-2">
                Estratégia de Ensino *
              </label>
              <textarea
                id="estrategiaEnsino"
                value={estrategiaEnsino}
                onChange={(e) => setEstrategiaEnsino(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                placeholder="Digite a estratégia de ensino que será utilizada..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={!titulo.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Gerando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Gerar Registro
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">Erro: {error}</p>
          </div>
        )}

        {generatedPrompt && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Prompt Gerado</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar Prompt
                </button>
                <a
                  href={notebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Abrir Notebook LM
                </a>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-6 mb-6">
              <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                {generatedPrompt}
              </pre>
            </div>

            {/* Iframe do Notebook LM */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notebook LM</h3>
              <div className="bg-gray-100 rounded-md p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Se o iframe não carregar, clique no link acima para abrir o Notebook LM em uma nova aba.
                </p>
                <iframe
                  src={notebookUrl}
                  width="100%"
                  height="600px"
                  className="border border-gray-300 rounded-md"
                  title="Notebook LM"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                >
                  <p className="text-gray-600 text-center py-4">
                    Seu navegador não suporta iframes. 
                    <a 
                      href={notebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Clique aqui para abrir o Notebook LM
                    </a>
                  </p>
                </iframe>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
