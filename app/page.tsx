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
  const [generatedData, setGeneratedData] = useState<any>(null);
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
      const response = await fetch('/api/gemini/generate', {
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
        if (data.ok) {
          setGeneratedData(data.data);
        } else {
          setError(data.error || 'Erro ao gerar conteúdo');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao gerar conteúdo');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedData) {
      const jsonString = JSON.stringify(generatedData, null, 2);
      navigator.clipboard.writeText(jsonString);
      alert('Dados copiados para a área de transferência!');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SDI - Senai Diário Inteligente
          </h1>
          <p className="text-gray-600">
            Integrado com a IA Google Gemini
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

        {generatedData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Diário de Aula Gerado</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar JSON
                </button>
                <div className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md">
                  <span className="text-xs">
                    {JSON.stringify(generatedData).length} caracteres
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Informações da Aula</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Título</label>
                    <p className="text-gray-800">{generatedData.titulo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Curso</label>
                    <p className="text-gray-800">{generatedData.curso}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Unidade Curricular</label>
                    <p className="text-gray-800">{generatedData.unidadeCurricular}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Estratégia de Ensino</label>
                    <p className="text-gray-800">{generatedData.estrategiaEnsino}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600">Descrição Original</label>
                  <p className="text-gray-800 mt-1">{generatedData.descricao_original}</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600">Descrição Melhorada</label>
                  <p className="text-gray-800 mt-1">{generatedData.descricao_melhorada}</p>
                </div>
                {generatedData.atividades && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600">Atividades</label>
                    <p className="text-gray-800 mt-1">{generatedData.atividades}</p>
                  </div>
                )}
              </div>

              {/* Capacidades da UC - Todas */}
              <div className="bg-blue-50 rounded-md p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  Capacidades da UC - Todas
                </h3>
                {Array.isArray(generatedData.capacidadesUC_todas) ? (
                  <ul className="space-y-2">
                    {generatedData.capacidadesUC_todas.map((capacidade: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-gray-800">{capacidade}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-600 italic">{generatedData.capacidadesUC_todas}</p>
                )}
              </div>

              {/* Capacidades Selecionadas */}
              <div className="bg-green-50 rounded-md p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Capacidades Relacionadas à Aula
                </h3>
                {Array.isArray(generatedData.capacidadesUC_selecionadas) ? (
                  <ul className="space-y-2">
                    {generatedData.capacidadesUC_selecionadas.map((capacidade: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-gray-800">{capacidade}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-600 italic">{generatedData.capacidadesUC_selecionadas}</p>
                )}
              </div>

              {/* Observações */}
              {generatedData.observacoes && generatedData.observacoes.length > 0 && (
                <div className="bg-yellow-50 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">Observações</h3>
                  <ul className="space-y-1">
                    {generatedData.observacoes.map((obs: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <span className="text-gray-800">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* JSON Raw (para debug) */}
              <details className="bg-gray-100 rounded-md p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  Ver JSON Completo (Debug)
                </summary>
                <pre className="mt-3 text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(generatedData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
