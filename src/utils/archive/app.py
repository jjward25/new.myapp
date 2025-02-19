from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import asyncio
import json
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import aiofiles
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_ollama import OllamaEmbeddings
import ollama
from datetime import datetime
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId


@dataclass
class Task:
    task_name: str
    project: str
    create_date: str
    due_date: str
    complete_date: Optional[str]
    description: str
    relevant_links: List[str]

class AsyncChatSystem:
    def __init__(self):
        self.TEXT_FILES_DIR = os.path.join(os.getcwd(), 'memory')
        self.ARTICLES_DIR = os.path.join(self.TEXT_FILES_DIR, 'gtm/articles')
        self.texts: Dict[str, str] = {}
        self.conversation_history: List[Dict[str, str]] = []
        self.tasks_data: Optional[Dict] = None
        self.vectordb = None
        self.embeddings = None
        self.OPENROUTER_API_KEY = "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"
        if not self.OPENROUTER_API_KEY:
            print("Warning: OPENROUTER_API_KEY not found in environment variables")
            self.OPENROUTER_API_KEY = "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"
        self.chat_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # MongoDB setup
        self.mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
        self.db = self.mongo_client.Chatbots
        self.tasks_collection = self.db.Tasks
        
        # Initialize directories
        for directory in [self.TEXT_FILES_DIR, self.ARTICLES_DIR]:
            os.makedirs(directory, exist_ok=True)
        
    async def initialize(self):
        """Async initialization of RAG components"""
        await self.load_documents()
        if os.path.exists(self.ARTICLES_DIR):
            documents = await self._load_pdf_documents()
            chunks = self._split_documents(documents)
            self.embeddings = self._get_embeddings()
            self.vectordb = await self._init_vectordb(chunks)

    async def _init_vectordb(self, chunks):
        return Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=os.path.join(self.TEXT_FILES_DIR, "chromadb")
        )

    async def load_documents(self):
        """Async load of text files"""
        for filename in os.listdir(self.TEXT_FILES_DIR):
            if filename.endswith('.txt'):
                try:
                    async with aiofiles.open(os.path.join(self.TEXT_FILES_DIR, filename), 'r', encoding='utf-8') as file:
                        self.texts[filename] = await file.read()
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")

    async def _load_pdf_documents(self):
        """Load PDFs asynchronously"""
        loader = PyPDFDirectoryLoader(self.ARTICLES_DIR)
        return await asyncio.to_thread(loader.load)

    def _split_documents(self, documents):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
            length_function=len,
        )
        return splitter.split_documents(documents)

    def _get_embeddings(self):
        return OllamaEmbeddings(model="nomic-embed-text")

    async def search_documents(self, query: str, k=9):
        if not self.vectordb:
            return "", []
        
        results = await asyncio.to_thread(self.vectordb.similarity_search, query, k)
        context = "\n".join(f"From {os.path.basename(doc.metadata.get('source', ''))}:\n{doc.page_content}"
                           for doc in results)
        sources = list(set(os.path.basename(doc.metadata.get('source', '')) for doc in results))
        return context, sources

    async def get_chat_completion(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Get chat completion from OpenRouter API"""
        if not self.OPENROUTER_API_KEY:
            raise ValueError("OpenRouter API key not configured")

        headers = {
            "Authorization": f"Bearer {self.OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "Content-Type": "application/json",
            "OR-ORGANIZATION": "personal"
        }
        
        print(f"Using API key: {self.OPENROUTER_API_KEY[:10]}...")  # Log first 10 chars of key for verification
        
        data = {
            "model": "deepseek/deepseek-r1:free",  # Using a reliable free model
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        try:
            async with httpx.AsyncClient() as client:
                print(f"Sending request to OpenRouter with messages: {messages}")  # Debug log
                response = await client.post(
                    self.chat_url,
                    headers=headers,
                    json=data,
                    timeout=30.0
                )
                response.raise_for_status()
                json_response = response.json()
                print(f"OpenRouter response: {json_response}")  # Debug log
                return json_response
        except Exception as e:
            print(f"OpenRouter API error: {str(e)}")
            print(f"Response content: {getattr(response, 'text', 'No response content')}")  # Debug log
            raise

    async def process_query(self, query: str) -> str:
        """Process user query and maintain conversation history"""
        # Handle delete task command
        if query.lower().startswith("delete task:"):
            task_name = query[len("delete task:"):].strip()
            try:
                success = await self.delete_task(task_name)
                if success:
                    return f"Task '{task_name}' has been deleted from tasks collection."
                else:
                    return f"Error: Could not find task '{task_name}'."
            except Exception as e:
                return f"Error deleting task: {str(e)}"

        # Handle task management commands
        if query.lower().startswith("add task:"):
            try:
                parts = query[9:].split("|")
                if len(parts) < 2:
                    return "Error: Please provide at least Task Name and Project Name. Format: add task: Task Name | Project Name"
                
                task_name = parts[0].strip()
                project = parts[1].strip()
                description = parts[2].strip() if len(parts) > 2 else "No description provided"
                due_date = parts[3].strip() if len(parts) > 3 else "No due date"
                relevant_links = [link.strip() for link in parts[4].strip()[1:-1].split(",")] if len(parts) > 4 else []
                
                success = await self.add_task(
                    task_name=task_name,
                    project=project,
                    description=description,
                    due_date=due_date,
                    relevant_links=relevant_links
                )
                
                if success:
                    return f"Task '{task_name}' added to project '{project}' successfully!"
                return "Error adding task: Failed to save to collection"
                
            except Exception as e:
                return f"Error adding task: {str(e)}"
        
        elif query.lower().startswith("complete task:"):
            task_name = query[len("complete task:"):].strip(': ')
            success = await self.complete_task(task_name)
            return f"Task '{task_name}' marked as complete!" if success else f"Error: Could not find task '{task_name}'"
        
        elif query.lower() in ["what are my open tasks?","what are all my open tasks?", "show tasks","show all tasks", "list tasks", "list open tasks"]:
            tasks_data = await self.get_tasks()
            if tasks_data and tasks_data.get("open_tasks"):
                response = "Open Tasks:\n"
                for task in tasks_data["open_tasks"]:
                    response += "\n----------------------------------------"
                    response += f"\nTask: {task['task_name']}"
                    response += f"\nProject: {task['project']}"
                    response += f"\nDue Date: {task['due_date']}"
                    response += f"\nDescription: {task['description']}"
                    if task.get('relevant_links'):
                        response += f"\nLinks: {', '.join(task['relevant_links'])}"
                response += "\n----------------------------------------"
                return response
            return "No open tasks found."

        # Build base messages array
        messages = [
            self.create_message(
                "You are a helpful assistant. " +
                "Keep responses concise and focused. " +
                "When documents are provided, use them to give accurate answers and cite your sources. " +
                "When no documents are provided, use your general knowledge to help.",
                'system'
            )
        ]

        # Only search documents if query starts with "docs"
        if query.lower().startswith("docs "):
            # Remove "docs " prefix from query
            doc_query = query[5:]
            context, sources = await self.search_documents(doc_query)
            
            if context:
                messages.append(self.create_message(
                    f"Here is relevant context from the documents:\n\n{context}\n\n" +
                    f"Remember to cite these sources at the end of your response: {sources}",
                    'system'
                ))
        
        # Add conversation history
        messages.extend(self.conversation_history[-5:])
        messages.append(self.create_message(query, 'user'))
        
        try:
            # Get response from OpenRouter
            response = await self.get_chat_completion(messages)
            
            # Debug logging
            print(f"Full OpenRouter response: {response}")
            
            if not response:
                print("Empty response from OpenRouter")
                return "I encountered an error: Empty response from API"
                
            if 'error' in response:
                print(f"OpenRouter error: {response['error']}")
                return f"I encountered an error: {response['error'].get('message', 'Unknown error')}"
                
            if 'choices' not in response:
                print(f"Missing 'choices' in response: {response}")
                return "I encountered an error: Invalid response format"
                
            response_content = response['choices'][0]['message']['content']
            
            # Add sources if they exist and aren't already included
            if query.lower().startswith("docs ") and sources and not response_content.strip().endswith(']'):
                response_content += f"\n\nSources: {sources}"
            
            # Update conversation history
            self.conversation_history.append(self.create_message(query, 'user'))
            self.conversation_history.append(self.create_message(response_content, 'assistant'))
            
            return response_content
            
        except Exception as e:
            print(f"Error in chat response: {str(e)}")
            print(f"Full error context: ", e.__class__.__name__, str(e))  # More detailed error logging
            return f"I encountered an error: {str(e)}. Please try again."

    async def get_tasks(self) -> Optional[Dict]:
        """Get tasks from MongoDB"""
        try:
            tasks_doc = await self.tasks_collection.find_one()
            if tasks_doc:
                # Convert ObjectId to string for JSON serialization
                tasks_doc["_id"] = str(tasks_doc["_id"])
                return tasks_doc
            return None
        except Exception as e:
            print(f"Error getting tasks from MongoDB: {str(e)}")
            return None

    async def save_tasks(self, tasks_data: Dict) -> bool:
        """Save tasks to MongoDB"""
        try:
            # Get the existing document's _id
            existing_doc = await self.tasks_collection.find_one()
            if existing_doc:
                # Update existing document
                result = await self.tasks_collection.replace_one(
                    {"_id": existing_doc["_id"]},
                    {k: v for k, v in tasks_data.items() if k != "_id"}  # Remove _id from update
                )
            else:
                # Insert new document
                result = await self.tasks_collection.insert_one(tasks_data)
            return True
        except Exception as e:
            print(f"Error saving tasks to MongoDB: {str(e)}")
            return False

    async def add_task(self, task_name: str, project: str, description: str = "No description provided", 
                      due_date: str = "No due date", relevant_links: Optional[List[str]] = None) -> bool:
        """Add a new task"""
        tasks_data = await self.get_tasks()
        if tasks_data:
            new_task = {
                "task_name": task_name,
                "project": project,
                "create_date": datetime.now().strftime("%Y-%m-%d"),
                "due_date": due_date,
                "complete_date": None,
                "description": description,
                "relevant_links": relevant_links or []
            }
            tasks_data["open_tasks"].append(new_task)
            return await self.save_tasks(tasks_data)
        return False

    async def complete_task(self, task_name: str) -> bool:
        """Complete a task"""
        try:
            tasks_data = await self.get_tasks()
            if not tasks_data:
                return False
            
            task_to_complete = None
            remaining_tasks = []
            
            for task in tasks_data["open_tasks"]:
                if task["task_name"].strip() == task_name.strip():
                    task_to_complete = task
                else:
                    remaining_tasks.append(task)
            
            if task_to_complete:
                task_to_complete["complete_date"] = datetime.now().strftime("%Y-%m-%d")
                tasks_data["open_tasks"] = remaining_tasks
                tasks_data["completed_tasks"].append(task_to_complete)
                return await self.save_tasks(tasks_data)
            
            return False
            
        except Exception as e:
            print(f"Error in complete_task: {str(e)}")
            return False

    async def delete_task(self, task_name: str) -> bool:
        """Delete a task from both open and completed tasks"""
        tasks_data = await self.get_tasks()
        if not tasks_data:
            return False
        
        task_found = False
        # Remove from open tasks
        original_open_count = len(tasks_data["open_tasks"])
        tasks_data["open_tasks"] = [
            task for task in tasks_data["open_tasks"]
            if task["task_name"].strip().lower() != task_name.strip().lower()
        ]
        if len(tasks_data["open_tasks"]) < original_open_count:
            task_found = True
        
        # Remove from completed tasks
        original_completed_count = len(tasks_data["completed_tasks"])
        tasks_data["completed_tasks"] = [
            task for task in tasks_data["completed_tasks"]
            if task["task_name"].strip().lower() != task_name.strip().lower()
        ]
        if len(tasks_data["completed_tasks"]) < original_completed_count:
            task_found = True
        
        if not task_found:
            return False
            
        return await self.save_tasks(tasks_data)

    def create_message(self, content: str, role: str) -> Dict[str, str]:
        """Create a message dictionary for the chat API"""
        return {
            "role": role,
            "content": content
        }

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def get():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Chat Interface</title>
            <style>
                body { margin: 20px; font-family: Arial, sans-serif; }
                #messages { 
                    margin-top: 20px; 
                    height: 400px; 
                    overflow-y: auto; 
                    border: 1px solid #ccc; 
                    padding: 10px; 
                }
                #messageInput { width: 300px; padding: 5px; }
                button { padding: 5px 10px; }
                .error { color: red; }
                .user { color: blue; }
                .assistant { color: green; }
                .system { color: gray; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Chat Interface</h1>
            <input id="messageInput" type="text" placeholder="Type your message...">
            <button onclick="sendMessage()">Send</button>
            <div id="messages"></div>

            <script>
                let ws = null;
                let reconnectAttempts = 0;
                const maxReconnectAttempts = 5;
                
                function connect() {
                    if (ws && ws.readyState === WebSocket.OPEN) return;
                    
                    displayMessage("System: Connecting to server...", "system");
                    
                    ws = new WebSocket("ws://" + window.location.host + "/api/chat");
                    
                    ws.onopen = function() {
                        displayMessage("System: Connected", "system");
                        reconnectAttempts = 0;
                    };
                    
                    ws.onclose = function() {
                        displayMessage("System: Disconnected", "system");
                        ws = null;
                        
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            displayMessage(`System: Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`, "system");
                            setTimeout(connect, 2000);
                        } else {
                            displayMessage("System: Could not reconnect. Please refresh the page.", "error");
                        }
                    };
                    
                    ws.onerror = function(error) {
                        console.error("WebSocket error:", error);
                        displayMessage("System: Connection error", "error");
                    };
                    
                    ws.onmessage = function(event) {
                        try {
                            const response = JSON.parse(event.data);
                            displayMessage("Assistant: " + response.response, "assistant");
                        } catch (error) {
                            console.error("Message parsing error:", error);
                            displayMessage("System: Error processing response", "error");
                        }
                    };
                }
                
                function sendMessage() {
                    const input = document.getElementById("messageInput");
                    const message = input.value.trim();
                    
                    if (!message) return;
                    
                    if (!ws || ws.readyState !== WebSocket.OPEN) {
                        displayMessage("System: Not connected. Attempting to reconnect...", "error");
                        connect();
                        return;
                    }
                    
                    try {
                        displayMessage("You: " + message, "user");
                        ws.send(JSON.stringify({
                            query: message,
                            model_url: null
                        }));
                        input.value = "";
                    } catch (error) {
                        console.error("Send error:", error);
                        displayMessage("System: Error sending message", "error");
                    }
                }
                
                function displayMessage(message, type) {
                    const messages = document.getElementById("messages");
                    const messageDiv = document.createElement("div");
                    messageDiv.className = type;
                    messageDiv.textContent = message;
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }

                document.getElementById("messageInput").addEventListener("keypress", function(e) {
                    if (e.key === "Enter") {
                        sendMessage();
                    }
                });

                // Start connection when page loads
                connect();
            </script>
        </body>
    </html>
    """

@app.websocket("/api/chat")
async def websocket_endpoint(websocket: WebSocket):
    print("New WebSocket connection attempt...")
    try:
        await websocket.accept()
        print("WebSocket connection accepted")
        
        chat_system = AsyncChatSystem()
        print("Initializing chat system...")
        await chat_system.initialize()
        print("Chat system initialized")
        
        while True:
            try:
                data = await websocket.receive_json()
                print(f"Received message: {data['query']}")
                
                response = await chat_system.process_query(data['query'])
                print(f"Sending response: {response[:100]}...")  # Log first 100 chars
                
                await websocket.send_json({"response": response})
                print("Response sent successfully")
                
            except WebSocketDisconnect:
                print("Client disconnected")
                break
            except Exception as e:
                print(f"Error processing message: {str(e)}")
                try:
                    await websocket.send_json({
                        "response": f"Error: {str(e)}. Please try again."
                    })
                except:
                    print("Could not send error message to client")
                    break
    except Exception as e:
        print(f"WebSocket connection error: {str(e)}")
    finally:
        try:
            await websocket.close()
        except:
            pass
        print("WebSocket connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)