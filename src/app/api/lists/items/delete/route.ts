import { NextResponse } from 'next/server';
import { deleteListItem } from '@/utils/mongoDB/listCRUD';

export async function DELETE(request: Request) {
  try {
    const { listName, itemName } = await request.json();
    
    if (!listName || !itemName) {
      return NextResponse.json(
        { error: 'List name and item name are required' },
        { status: 400 }
      );
    }

    const result = await deleteListItem(listName, itemName);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete item' },
      { status: 500 }
    );
  }
} 