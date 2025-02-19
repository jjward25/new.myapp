import { NextResponse } from 'next/server';
import { updateListItem } from '@/utils/mongoDB/listCRUD';

export async function PUT(request: Request) {
  try {
    const { listName, itemName, updates } = await request.json();
    
    if (!listName || !itemName || !updates) {
      return NextResponse.json(
        { error: 'List name, item name, and updates are required' },
        { status: 400 }
      );
    }

    const result = await updateListItem(listName, itemName, updates);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update item' },
      { status: 500 }
    );
  }
} 