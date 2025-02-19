//src/app/chat/page.tsx
'use client'
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Model {
  id: string;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState(''); 
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedApiKey = process.env.OPENROUTER_API_KEY;

    async function fetchApiData() {
      const code = searchParams.get('code');
      if (code) {
        const apiRoute = '/api/chat/oauth';
        const requestOptions = {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }) 
        };
        try {
          const response = await fetch(apiRoute, requestOptions);
          const data = await response.json();
          if (data.key) {
            window.localStorage.setItem('apiKey', data.key);
            setApiKey(data.key);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    }

    async function fetchModels() {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        const filteredModels = data.data.filter((model: Model) => model.id.toLowerCase().includes('free'));
        setModels(filteredModels);
        if (filteredModels.length > 0) {
          setSelectedModel(filteredModels[0].id);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    }

    fetchApiData();
    fetchModels();
  }, [searchParams]);

  const openRouterAuth = () => {
    window.open('https://openrouter.ai/auth?callback_url=http://localhost:3000/chat');
  };

  const getCompletionsResponse = async () => {
    setIsLoading(true);
    const apiRoute = '/api/chat/completions';
    const requestBody = { apiKey, model: selectedModel, text: inputText };
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    };
    try {
      const response = await fetch(apiRoute, requestOptions);
      const data = await response.json();
      setMessage(data.choices[0].message.content);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      {apiKey ? (
        <button
          className="absolute top-5 right-5 rounded-lg bg-blue-600 text-white py-2 px-4 hover:bg-blue-500 shadow-lg"
          onClick={() => {
            window.localStorage.removeItem('apiKey');
            setApiKey('');
          }}
        >
          Log Out
        </button>
      ) : null}
      {apiKey ? (
        <>
          <div className="w-2/3 mx-auto text-center mt-10 mb-4">
            <label htmlFor="model-dropdown" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Choose Model (Only Free Models)
            </label>
            <select
              id="model-dropdown"
              className="block w-full bg-white dark:bg-gray-800 border border-gray-300 rounded-md py-2 pl-3 pr-10"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model, index) => (
                <option key={index} value={model.id}>{model.id}</option>
              ))}
            </select>
          </div>
          <button
            className={`w-2/3 rounded-lg py-2 shadow-lg ${!inputText || isLoading ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            onClick={getCompletionsResponse}
            disabled={!inputText || isLoading}
          >
            {isLoading ? 'Loading...' : 'Get Response'}
          </button>
          <div className="mt-4 px-6 py-4 w-2/3 mx-auto bg-white rounded-lg shadow-md">
            <p>{message || "Your response will appear here..."}</p>
          </div>
        </>
      ) : (
        <div className="w-full text-center pb-8 pt-10">
          <p className='text-gray-800 text-lg'>Log in to access free models.</p>
          <button
            className="w-1/3 rounded-md bg-gray-300 text-black py-3 px-6 hover:bg-gray-200 shadow-md"
            onClick={openRouterAuth}
          >
            <Image src="/or_logo.png" alt="OpenRouter Logo" width="20" height="20" className="mr-2" /> Log In
          </button>
        </div>
      )}
    </main>
  );
}
