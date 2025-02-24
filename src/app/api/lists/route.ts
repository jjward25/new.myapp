import { getLists, getListByName, createList, addItemsToList } from "@/utils/mongoDB/listCRUD"
import { NextResponse } from "next/server"

interface ListItem {
  name: string
  done: boolean
  length?: string
  rating?: number | null
  notes?: string
}

interface CreateListRequest {
  name: string
  list: ListItem[]
}

interface AddItemsRequest {
  listName: string
  items: ListItem[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const listName = searchParams.get("name")

    if (listName) {
      // If a specific list name is provided, fetch that list
      const list = await getListByName(listName)
      if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 })
      }
      return NextResponse.json({ list: list.list })
    } else {
      // If no list name is provided, fetch all lists
      const lists = await getLists()
      return NextResponse.json({ lists })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch lists" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === "createList") {
    return await handleCreateList(body);
  } else if (action === "addItems") {
    return await handleAddItems(body);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

async function handleCreateList(body: any) {
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  try {
    const result = await createList(name);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create list" },
      { status: 500 }
    );
  }
}

async function handleAddItems(body: any) {
  const { listName, items } = body;

  if (!listName) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const invalidItems = items.filter((item) => !item.name);
  if (invalidItems.length > 0) {
    return NextResponse.json({ error: "All items must have a name" }, { status: 400 });
  }

  try {
    const result = await addItemsToList(listName, items);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error adding items:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error adding items" }, { status: 500 });
  }
}

