"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useSearchParams } from "next/navigation"
import Image from "next/image"

interface Model {
  id: string
}

export default function Home() {
  const [apiKey, setApiKey] = useState("")
  const [message, setMessage] = useState("")
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchModels()
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    const code = searchParams.get("code")
    if (code) {
      try {
        const response = await fetch("/api/chat/oauth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })
        const data = await response.json()
        if (data.key) {
          setApiKey(data.key)
        }
      } catch (error) {
        console.error("Error handling OAuth callback:", error)
      }
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models")
      const data = await response.json()
      const filteredModels = data.data.filter((model: Model) => model.id.toLowerCase().includes("free"))
      setModels(filteredModels)
      if (filteredModels.length > 0) {
        setSelectedModel(filteredModels[0].id)
      }
    } catch (error) {
      console.error("Error fetching models:", error)
    }
  }

  const openRouterAuth = () => {
    const callbackUrl = `${window.location.origin}/`
    window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}`
  }

  const getCompletionsResponse = async () => {
    setIsLoading(true)
    setMessage("") // Clear previous message
    const apiRoute = "/api/chat/completions"
    const requestBody = { model: selectedModel, text: inputText }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    }
    try {
      const response = await fetch(apiRoute, requestOptions)
      const data = await response.json()

      if (response.ok) {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          setMessage(data.choices[0].message.content)
        } else {
          setMessage("Received an unexpected response format from the server.")
        }
      } else {
        setMessage(`Error: ${data.error?.message || "An unknown error occurred"}`)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setMessage("An error occurred while fetching the response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      getCompletionsResponse()
    }
  }

  const handleLogout = () => {
    setApiKey("")
  }

  return (
    <main className="flex flex-col items-center justify-center h-auto p-24 border-2 border-cyan-700 w-full rounded-md">
      {apiKey ? (
        <button
          className="absolute top-5 right-5 rounded-lg bg-blue-600 text-white py-2 px-4 hover:bg-blue-500 shadow-lg"
          onClick={handleLogout}
        >
          Log Out
        </button>
      ) : null}
      {apiKey ? (
        <>
          <div className="w-full mx-auto text-center mt-10 mb-4">
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
                <option key={index} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center border-b border-gray-300 py-2">
              <input
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                type="text"
                placeholder="Type your message here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                className={`flex-shrink-0 rounded-lg py-2 px-4 shadow-lg ${
                  !inputText || isLoading ? "bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
                type="submit"
                disabled={!inputText || isLoading}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
          <div className="mt-4 px-6 py-4 w-full mx-auto bg-white rounded-lg shadow-md">
            <p>{message || "Your response will appear here..."}</p>
          </div>
        </>
      ) : (
        <div className="w-full text-center pb-8 pt-10">
          <p className="text-gray-800 text-lg">Log in to access LLMs</p>
          <button
            className="w-1/3 rounded-md bg-gray-300 text-black py-3 px-6 hover:bg-gray-200 shadow-md flex flex-row items-center justify-center mx-auto"
            onClick={openRouterAuth}
          >
            <Image src="/or_logo.png" alt="OpenRouter Logo" width="20" height="20" className="mr-2" /> Log In
          </button>
        </div>
      )}
    </main>
  )
}

