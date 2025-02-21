"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

const AVAILABLE_LISTS = ["Movies", "Books", "Shopping", "TV Shows"] as const
type ListName = (typeof AVAILABLE_LISTS)[number]

interface ListItemBase {
  name: string
  done: boolean
}

interface MovieItem extends ListItemBase {
  length?: string
  rating?: number | null
  notes?: string
}

type ListItem = ListItemBase | MovieItem

const AddListItemButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ListName | "">("")
  const [newListName, setNewListName] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<Partial<MovieItem>[]>([
    {
      name: "",
      done: false,
      length: "",
      rating: null,
      notes: "",
    },
  ])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedList("")
        setNewListName("")
        setItems([{
          name: "",
          done: false,
          length: "",
          rating: null,
          notes: "",
        }])
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createList",
          name: newListName,
          list: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }

      setNewListName("")
      window.location.reload()
    } catch (error) {
      console.error("Error creating list:", error)
      alert("Failed to create list")
    }
  }

  const handleItemChange = (index: number, field: keyof MovieItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addNewItem = () => {
    setItems([
      ...items,
      {
        name: "",
        done: false,
        length: "",
        rating: null,
        notes: "",
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedList) {
      alert("Please select a list")
      return
    }

    const validItems = items.filter((item) => item.name?.trim())

    if (validItems.length === 0) {
      alert("Please add at least one item with a name")
      return
    }

    const payload = {
      action: "addItems",
      listName: selectedList,
      items: validItems.map((item) => ({
        name: item.name ? item.name.trim() : "",
        done: false,
        ...(selectedList === "Movies" && {
          length: item.length || "",
          rating: item.rating || null,
          notes: item.notes || "",
        }),
      })),
    }

    console.log("Submitting with payload:", JSON.stringify(payload, null, 2))

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server error response:", errorData)
        throw new Error(errorData.error || "Failed to add items")
      }

      const data = await response.json()
      console.log("Server response:", data)

      setItems([{
        name: "",
        done: false,
        length: "",
        rating: null,
        notes: "",
      }])
      setIsOpen(false)
      setSelectedList("")

      alert("Items added successfully!")
      window.location.reload()
    } catch (error) {
      console.error("Error adding items:", error)
      alert(error instanceof Error ? error.message : "Failed to add items")
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="btn text-sm mx-0 hover:border-yellow-500 bg-cyan-950 border-cyan-200 text-white btn-secondary hover:bg-cyan-950 hover:text-cyan-300 w-full max-w-[1000px] min-h-0 h-10 mb-2"
      >
        Add List Items
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Add New List</h2>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    List Name
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      required
                    />
                  </label>
                </div>
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">
                  Create List
                </button>
              </form>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold mb-4">Add New Items</h2>

              {!selectedList ? (
                <div>
                  <h3 className="mb-3">Select List:</h3>
                  <div className="space-y-2">
                    {AVAILABLE_LISTS.map((list) => (
                      <button
                        key={list}
                        onClick={() => setSelectedList(list)}
                        className="block w-full text-left px-4 py-2 hover:bg-cyan-100 rounded"
                      >
                        {list}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="text-lg font-semibold mb-2">Adding items to: {selectedList}</h3>
                  {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg relative">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, "name", e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                              required
                            />
                          </label>
                        </div>

                        {selectedList === "Movies" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Length
                                <input
                                  type="text"
                                  value={item.length}
                                  onChange={(e) => handleItemChange(index, "length", e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                  placeholder="2h15m"
                                />
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Rating
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.5"
                                  value={item.rating || ""}
                                  onChange={(e) =>
                                    handleItemChange(index, "rating", e.target.value ? Number(e.target.value) : null)
                                  }
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                />
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Notes
                                <textarea
                                  value={item.notes}
                                  onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                />
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addNewItem}
                    className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg hover:border-cyan-500 hover:text-cyan-500"
                  >
                    + Add Another Item
                  </button>

                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        setSelectedList("")
                        setItems([{
                          name: "",
                          done: false,
                          length: "",
                          rating: null,
                          notes: "",
                        }])
                      }}
                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">
                      Add Items
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddListItemButton

